function extractArtType(descText) {
    const teknikMatch = descText.match(/([^,]+) üzerine ([^,]+)/);
    if (teknikMatch) {
        return convertTurkishChars(`${teknikMatch[2]} (${teknikMatch[1]})`);
    } else {
        const parts = descText.split(/[.,]/).map(part => part.trim());

        let teknik = parts[0].split(/\s+/)[0]; // İlk kelimeyi al
        let yuzey = '';

        for (const part of parts) {
            const parantezMatch = part.match(/\(([^)]+)\)/);
            if (parantezMatch) {
                yuzey = parantezMatch[1].trim();
                break;
            }
        }

        let turu = yuzey ? `${teknik} (${yuzey})` : teknik;
        return turu;
    }
}

// Örnek testler
console.log(extractArtType("karisik teknik. Imzasiz. 76x127 cm (Tuval)")); // karisik (Tuval)
console.log(extractArtType("yagliboya. 1976 tarihli. 27x38 cm (Mukavva)")); // yagliboya (Muk
