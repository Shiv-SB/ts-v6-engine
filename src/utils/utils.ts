export class Bit64 {
    private bits: Uint8Array;
  
    constructor(value: bigint = 0n) {
      this.bits = new Uint8Array(64);
      this.setValue(value);
    }
  
    setValue(value: bigint): void {
      for (let i = 0; i < 64; i++) {
        this.bits[i] = Number((value >> BigInt(i)) & 1n);
      }
    }
  
    getValue(): bigint {
      return this.bits.reduce((acc, bit, i) => acc | (BigInt(bit) << BigInt(i)), 0n);
    }
  
    getBit(index: number): number {
      if (index < 0 || index >= 64) throw new RangeError("Index out of range");
      return this.bits[index];
    }
  
    setBit(index: number, value: number): void {
      if (index < 0 || index >= 64) throw new RangeError("Index out of range");
      this.bits[index] = value;
    }
  }