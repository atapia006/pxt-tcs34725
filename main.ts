//% color=#FF5733 weight=100 icon="\uf043" block="TCS34725"
namespace tcs34725 {
    const ADDRESS = 0x29;

    //% block="Inizializatu"
    export function init(): void {
        pins.i2cWriteNumber(ADDRESS, 0x80, NumberFormat.UInt8BE);
    }
}