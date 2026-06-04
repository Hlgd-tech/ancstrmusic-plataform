use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("MusicStreaming11111111111111111111111111111");

#[program]
pub mod decentralized_music {
    use super::*;

    /// Inicializa la plataforma y define la wallet de la tesorería de la casa (15% de comisión).
    pub fn initialize_platform(ctx: Context<InitializePlatform>, fee_percentage: u16) -> Result<()> {
        let platform_state = &mut ctx.accounts.platform_state;
        platform_state.admin = *ctx.accounts.admin.key;
        platform_state.treasury = *ctx.accounts.treasury.key;
        platform_state.fee_percentage = fee_percentage; // Representado en puntos básicos (e.g., 1500 para 15%)
        Ok(())
    }

    /// Registra una nueva pista musical en la blockchain con su metadato de IPFS y precio.
    pub fn register_track(
        ctx: Context<RegisterTrack>,
        track_id: String,
        ipfs_hash: String,
        price_sol: u64,
        price_usdc: u64,
    ) -> Result<()> {
        let track = &mut ctx.accounts.track;
        track.artist = *ctx.accounts.artist.key;
        track.track_id = track_id;
        track.ipfs_hash = ipfs_hash;
        track.price_sol = price_sol;
        track.price_usdc = price_usdc;
        track.sales_count = 0;
        Ok(())
    }

    /// Compra una pista musical usando SOL. Realiza un split atómico de 85% para el artista y 15% para la casa.
    pub fn purchase_track_sol(ctx: Context<PurchaseTrackSol>) -> Result<()> {
        let track = &mut ctx.accounts.track;
        let platform = &ctx.accounts.platform_state;
        let price = track.price_sol;

        // Calcular split (15% para la casa, 85% para el artista)
        let house_fee = (price * platform.fee_percentage as u64) / 10000;
        let artist_share = price - house_fee;

        // 1. Transferencia al Artista (85%)
        let artist_ix = anchor_lang::solana_program::system_instruction::transfer(
            ctx.accounts.buyer.key,
            ctx.accounts.artist.key,
            artist_share,
        );
        anchor_lang::solana_program::program::invoke(
            &artist_ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.artist.to_account_info(),
            ],
        )?;

        // 2. Transferencia a la Tesorería de la Plataforma (15%)
        let platform_ix = anchor_lang::solana_program::system_instruction::transfer(
            ctx.accounts.buyer.key,
            ctx.accounts.treasury.key,
            house_fee,
        );
        anchor_lang::solana_program::program::invoke(
            &platform_ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
            ],
        )?;

        // Registrar la venta
        track.sales_count += 1;

        emit!(TrackPurchased {
            buyer: *ctx.accounts.buyer.key,
            track_id: track.track_id.clone(),
            amount: price,
            currency: "SOL".to_string(),
        });

        Ok(())
    }

    /// Compra una pista musical usando USDC. Realiza un split atómico de 85% para el artista y 15% para la casa.
    pub fn purchase_track_usdc(ctx: Context<PurchaseTrackUsdc>) -> Result<()> {
        let track = &mut ctx.accounts.track;
        let platform = &ctx.accounts.platform_state;
        let price = track.price_usdc;

        // Calcular split (15% para la casa, 85% para el artista)
        let house_fee = (price * platform.fee_percentage as u64) / 10000;
        let artist_share = price - house_fee;

        // 1. Transferir 85% al token account del Artista
        let cpi_accounts_artist = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.artist_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_artist = Context::new(cpi_program.clone(), cpi_accounts_artist);
        token::transfer(cpi_ctx_artist, artist_share)?;

        // 2. Transferir 15% al token account de la Tesorería de la Plataforma
        let cpi_accounts_treasury = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_ctx_treasury = Context::new(cpi_program, cpi_accounts_treasury);
        token::transfer(cpi_ctx_treasury, house_fee)?;

        // Registrar la venta
        track.sales_count += 1;

        emit!(TrackPurchased {
            buyer: *ctx.accounts.buyer.key,
            track_id: track.track_id.clone(),
            amount: price,
            currency: "USDC".to_string(),
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(init, payer = admin, space = 8 + 32 + 32 + 2)]
    pub platform_state: Account<'info, PlatformState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: Wallet de la tesorería de la casa
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(track_id: String)]
pub struct RegisterTrack<'info> {
    #[account(
        init,
        payer = artist,
        space = 8 + 32 + 4 + track_id.len() + 4 + 64 + 8 + 8 + 8,
        seeds = [b"track", artist.key().as_ref(), track_id.as_bytes()],
        bump
    )]
    pub track: Account<'info, Track>,
    #[account(mut)]
    pub artist: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PurchaseTrackSol<'info> {
    #[account(mut)]
    pub track: Account<'info, Track>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: Wallet del artista que recibe el 85%
    #[account(mut, constraint = artist.key() == track.artist)]
    pub artist: AccountInfo<'info>,
    /// CHECK: Wallet de la tesorería que recibe el 15%
    #[account(mut, constraint = treasury.key() == platform_state.treasury)]
    pub treasury: AccountInfo<'info>,
    pub platform_state: Account<'info, PlatformState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PurchaseTrackUsdc<'info> {
    #[account(mut)]
    pub track: Account<'info, Track>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    /// CHECK: Cuenta asociada del Artista
    #[account(mut)]
    pub artist_token_account: Account<'info, TokenAccount>,
    /// CHECK: Cuenta asociada de la Tesorería de la Plataforma
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    pub platform_state: Account<'info, PlatformState>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct PlatformState {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub fee_percentage: u16, // En puntos básicos (e.g., 1500 = 15.00%)
}

#[account]
pub struct Track {
    pub artist: Pubkey,
    pub track_id: String,
    pub ipfs_hash: String,
    pub price_sol: u64,
    pub price_usdc: u64,
    pub sales_count: u64,
}

#[event]
pub mod events {
    use super::*;
    #[derive(AnchorSerialize, AnchorDeserialize)]
    pub struct TrackPurchased {
        pub buyer: Pubkey,
        pub track_id: String,
        pub amount: u64,
        pub currency: String,
    }
}
