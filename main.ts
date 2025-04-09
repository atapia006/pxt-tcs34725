//% color=#800080 weight=100 icon="\uf2db" block="TCS34725"
namespace tcs34725 {
    //% uses="neopixel"
    // ------------------------- CONSTANTS -------------------------
    const TCS34725_ADDRESS = 0x29;
    const TCS34725_COMMAND_BIT = 0x80;
    const ENABLE = 0x00;
    const ATIME = 0x01;
    const CONTROL = 0x0F;
    const ID = 0x12;
    const CDATA = 0x14;
    const RDATA = 0x16;
    const GDATA = 0x18;
    const BDATA = 0x1A;

    // ------------------------- VARIABLES -------------------------
    let _initialized = false;
    let _gain = 1;
    let _whiteRef = 65535;
    let _blackRef = 0;

    // ------------------------- CORE FUNCTIONS -------------------------
    function writeReg(reg: number, value: number): void {
        pins.i2cWriteNumber(TCS34725_ADDRESS, (TCS34725_COMMAND_BIT | reg) << 8 | value, NumberFormat.UInt16BE);
    }

    function readWordReg(reg: number): number {
        pins.i2cWriteNumber(TCS34725_ADDRESS, (TCS34725_COMMAND_BIT | reg) << 8, NumberFormat.UInt16BE);
        return pins.i2cReadNumber(TCS34725_ADDRESS, NumberFormat.UInt16LE);
    }

    //% block="Initialize sensor"
    //% subcategory="Configuration"
    export function initialize(): void {
        if (_initialized) return;
        if (readWordReg(ID) != 0x0044) return;

        writeReg(ENABLE, 0x01);
        writeReg(ENABLE, 0x03);
        writeReg(ATIME, 0xFF);
        writeReg(CONTROL, 0x00);

        _initialized = true;
        basic.pause(3);
    }

    // ------------------------- MEASUREMENTS -------------------------
    //% block="Red"
    //% subcategory="Measurements"
    export function red(): number {
        initialize();
        return readWordReg(RDATA) / _gain;
    }

    //% block="Green"
    //% subcategory="Measurements"
    export function green(): number {
        initialize();
        return readWordReg(GDATA) / _gain;
    }

    //% block="Blue"
    //% subcategory="Measurements"
    export function blue(): number {
        initialize();
        return readWordReg(BDATA) / _gain;
    }

    //% block="Clear"
    //% subcategory="Measurements"
    export function clear(): number {
        initialize();
        return readWordReg(CDATA) / _gain;
    }

    //% block="RGB values"
    //% subcategory="Measurements"
    export function rgb(): number[] {
        return [red(), green(), blue()];
    }

    // ------------------------- COLOR PROCESSING -------------------------
    //% block="HSV values"
    //% subcategory="Color Processing"
    export function hsv(): number[] {
        let [r, g, b] = rgb();
        let max = Math.max(Math.max(r, g), b) / 65535;
        let min = Math.min(Math.min(r, g), b) / 65535;
        let delta = max - min;

        let h = 0, s = 0, v = max * 100;

        if (delta > 0) {
            s = (delta / max) * 100;
            if (max == r / 65535) h = ((g - b) / 65535 / delta) % 6;
            else if (max == g / 65535) h = (b - r) / 65535 / delta + 2;
            else h = (r - g) / 65535 / delta + 4;
            h = Math.round(h * 60);
            if (h < 0) h += 360;
        }

        return [h, s, v];
    }

    //% block="Color name"
    //% subcategory="Color Processing"
    export function colorName(): string {
        let [h, s, v] = hsv();
        if (v < 10) return "Black";
        if (s < 20) return "White";
        if (h < 15) return "Red";
        else if (h < 45) return "Orange";
        else if (h < 90) return "Yellow";
        else if (h < 150) return "Green";
        else if (h < 210) return "Cyan";
        else if (h < 270) return "Blue";
        else if (h < 330) return "Magenta";
        else return "Red";
    }

    //% block="DeltaE between %color1 and %color2"
    //% subcategory="Color Processing"
    export function deltaE(color1: number[], color2: number[]): number {
        let lab1 = rgbToLab(color1);
        let lab2 = rgbToLab(color2);
        let dL = lab1[0] - lab2[0];
        let dA = lab1[1] - lab2[1];
        let dB = lab1[2] - lab2[2];
        return Math.sqrt(dL * dL + dA * dA + dB * dB);
    }

    function rgbToLab(rgb: number[]): number[] {
        let r = rgb[0] / 65535, g = rgb[1] / 65535, b = rgb[2] / 65535;
        let x = 0.4124 * r + 0.3576 * g + 0.1805 * b;
        let y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        let z = 0.0193 * r + 0.1192 * g + 0.9505 * b;
        
        x /= 0.95047; y /= 1.0; z /= 1.08883;  // Added semicolons to separate statements
        x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);  // Added parentheses
        y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);  // Added parentheses
        z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);  // Added parentheses
        
        return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    }

    // ------------------------- OUTPUT -------------------------
    //% block="Show color R %r G %g B %b on Neopixel"
    //% subcategory="Output"
    export function showNeopixel(r: number, g: number, b: number): void {
        // Create NeoPixel strip on pin P0 with 1 LED
        let strip = neopixel.create(DigitalPin.P0, 1, NeoPixelMode.RGB);

        // Set color (convert 16-bit to 8-bit)
        strip.setPixelColor(0, neopixel.rgb(
            Math.map(r, 0, 65535, 0, 255),
            Math.map(g, 0, 65535, 0, 255),
            Math.map(b, 0, 65535, 0, 255)
        ));
        strip.show();
    }

    // ------------------------- LINE DETECTION -------------------------
    //% block="Calibrate white reference"
    //% subcategory="Line Detection"
    export function calibrateWhite(): void {
        _whiteRef = clear();
    }

    //% block="Calibrate black reference"
    //% subcategory="Line Detection"
    export function calibrateBlack(): void {
        _blackRef = clear();
    }

    //% block="Detect line (white/black)"
    //% subcategory="Line Detection"
    export function detectLine(): boolean {
        let current = clear();
        let threshold = (_whiteRef + _blackRef) / 2;
        return current < threshold;  // true = beltza, false = zuria
    }
}