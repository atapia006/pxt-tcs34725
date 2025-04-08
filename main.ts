namespace tcs34725 {
    const ADDRESS = 0x29;

    //% block="Hasieratu"
    export function init(): void {
        pins.i2cWriteNumber(ADDRESS, 0x80, NumberFormat.UInt8BE);
    }
}
