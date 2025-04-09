//% color=#800080 weight=100 icon="\uf2db" block="TCS34725"
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

    //% block="Read Red"
    //% subcategory="Measurements"
    export function readRed(): number {
        initialize(); // Auto-initialize if needed
        return readWordReg(RDATA);
    }

    //% block="Read Green"
    //% subcategory="Measurements" 
    export function readGreen(): number {
        initialize();
        return readWordReg(GDATA);
    }

    //% block="Read Blue"
    //% subcategory="Measurements"
    export function readBlue(): number {
        initialize();
        return readWordReg(BDATA);
    }

    //% block="Read Clear Light"
    //% subcategory="Measurements"
    export function readClear(): number {
        initialize();
        return readWordReg(CDATA);
    }

    //% block="Read RGB Values"
    //% subcategory="Measurements"
    export function readRGB(): number[] {
        initialize();
        return [readRed(), readGreen(), readBlue()];
    }
}
