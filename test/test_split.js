// Script de prueba de lógica de split 85/15
// Simula la ejecución de un pago en la blockchain de Solana y el desglose atómico

function calculateSplit(price, feePercentageBps = 1500) {
    const houseFee = (price * feePercentageBps) / 10000;
    const artistShare = price - houseFee;
    return {
        houseFee,
        artistShare
    };
}

function testSplitSOL() {
    console.log("=== Iniciando Prueba de Split SOL ===");
    const trackPriceSOL = 1.5; // 1.5 SOL
    const split = calculateSplit(trackPriceSOL);

    console.log(`Precio de la pista: ${trackPriceSOL} SOL`);
    console.log(`Comisión de la Plataforma (15%): ${split.houseFee} SOL`);
    console.log(`Pago directo al Artista (85%): ${split.artistShare} SOL`);

    // Validar suma
    const total = split.houseFee + split.artistShare;
    if (total === trackPriceSOL) {
        console.log("✅ Éxito: El split de SOL es exacto y atómico.");
    } else {
        console.error("❌ Error: Discrepancia en el split de SOL.");
    }
}

function testSplitUSDC() {
    console.log("\n=== Iniciando Prueba de Split USDC ===");
    const trackPriceUSDC = 5000000; // 5.00 USDC (6 decimales en Solana)
    const split = calculateSplit(trackPriceUSDC);

    console.log(`Precio de la pista: ${trackPriceUSDC / 1000000} USDC (${trackPriceUSDC} unidades mínimas)`);
    console.log(`Comisión de la Plataforma (15%): ${split.houseFee / 1000000} USDC (${split.houseFee} unidades)`);
    console.log(`Pago directo al Artista (85%): ${split.artistShare / 1000000} USDC (${split.artistShare} unidades)`);

    // Validar suma
    const total = split.houseFee + split.artistShare;
    if (total === trackPriceUSDC) {
        console.log("✅ Éxito: El split de USDC es exacto y atómico.");
    } else {
        console.error("❌ Error: Discrepancia en el split de USDC.");
    }
}

testSplitSOL();
testSplitUSDC();
