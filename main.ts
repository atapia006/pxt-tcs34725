namespace tcs34725 {
    // I2C address of TCS34725 (fixed)
    const TCS34725_ADDRESS = 0x29;

    // Command bit for register access
    const TCS34725_COMMAND_BIT = 0x80;

    // Register map
    const ENABLE = 0x00;   // Enable register
    const ATIME = 0x01;    // Integration time
    const ID = 0x12;       // Device ID register
    const CDATA = 0x14;    // Clear channel data
    const RDATA = 0x16;    // Red channel data
    const GDATA = 0x18;    // Green channel data
    const BDATA = 0x1A;    // Blue channel data

    // Initialization flag
    let _initialized = false;

    // Helper: Write to I2C register
    function writeReg(reg: number, value: number): void {
        pins.i2cWriteNumber(TCS34725_ADDRESS, (TCS34725_COMMAND_BIT | reg) << 8 | value, NumberFormat.UInt16BE);
    }

    // Helper: Read 16-bit value from register
    function readWordReg(reg: number): number {
        pins.i2cWriteNumber(TCS34725_ADDRESS, (TCS34725_COMMAND_BIT | reg) << 8, NumberFormat.UInt16BE);
        return pins.i2cReadNumber(TCS34725_ADDRESS, NumberFormat.UInt16LE);
    }

    //% block="Initialize TCS34725"
    //% subcategory="Configuration"
    export function initialize(): void {
        if (_initialized) return;

        // Check device ID (0x44 for TCS34725)
        if (readWordReg(ID) != 0x0044) {
            return; // Sensor not detected
        }

        // Power on and enable RGB measurements
        writeReg(ENABLE, 0x01); // Power ON
        writeReg(ENABLE, 0x03);  // Power + RGBC
        writeReg(ATIME, 0xFF);   // Set integration time (2.4ms)

        _initialized = true;
        basic.pause(3); // Wait for first measurement
    }

    //% block="Red"
    //% subcategory="Measurements"
    export function red(): number {
        initialize();
        return readWordReg(RDATA);
    }

    //% block="Green"
    //% subcategory="Measurements"
    export function green(): number {
        initialize();
        return readWordReg(GDATA);
    }

    //% block="Blue"
    //% subcategory="Measurements"
    export function blue(): number {
        initialize();
        return readWordReg(BDATA);
    }

    //% block="Clear"
    //% subcategory="Measurements"
    export function clear(): number {
        initialize();
        return readWordReg(CDATA);
    }

    //% block="RGB"
    //% subcategory="Measurements"
    export function rgb(): number[] {
        initialize();
        return [red(), green(), blue()];
    }

    //% block="Get HSV values"
    export function getHSV(): number[] {
        let [r, g, b] = rgb();  // RGB lortu (0-65535)

        // Normalizatu (0-1)
        let normR = r / 65535;
        let normG = g / 65535;
        let normB = b / 65535;

        // RGB → HSV bihurtzeko algoritmoa
        let max = Math.max(normR, normG, normB);
        let min = Math.min(normR, normG, normB);
        let delta = max - min;

        let h = 0, s = 0, v = max * 100;

        if (delta > 0) {
            s = (delta / max) * 100;
            if (max == normR) h = ((normG - normB) / delta) % 6;
            else if (max == normG) h = (normB - normR) / delta + 2;
            else h = (normR - normG) / delta + 4;
            h = Math.round(h * 60);
            if (h < 0) h += 360;
        }

        return [h, s, v];  // [H°, S%, V%]
    }
}
