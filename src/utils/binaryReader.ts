export class B2BinaryReader {
  readonly bytes: Uint8Array
  position = 0

  constructor(data: Uint8Array) {
    this.bytes = data
  }

  private assertRoom(size: number): void {
    if (this.position + size > this.bytes.length) {
      throw new Error(
        `read past end at 0x${this.position.toString(16)} (+${size})`,
      )
    }
  }

  readInt32(): number {
    this.assertRoom(4)
    const view = new DataView(
      this.bytes.buffer,
      this.bytes.byteOffset + this.position,
      4,
    )
    const v = view.getInt32(0, true)
    this.position += 4
    return v
  }

  readUInt32(): number {
    this.assertRoom(4)
    const view = new DataView(
      this.bytes.buffer,
      this.bytes.byteOffset + this.position,
      4,
    )
    const v = view.getUint32(0, true)
    this.position += 4
    return v
  }

  readInt64(): bigint {
    this.assertRoom(8)
    const view = new DataView(
      this.bytes.buffer,
      this.bytes.byteOffset + this.position,
      8,
    )
    const v = view.getBigInt64(0, true)
    this.position += 8
    return v
  }

  readSingle(): number {
    this.assertRoom(4)
    const view = new DataView(
      this.bytes.buffer,
      this.bytes.byteOffset + this.position,
      4,
    )
    const v = view.getFloat32(0, true)
    this.position += 4
    return v
  }

  readBytes(count: number): Uint8Array {
    this.assertRoom(count)
    const slice = this.bytes.subarray(this.position, this.position + count)
    this.position += count
    return slice.slice()
  }

  read7BitEncodedInt(): number {
    let count = 0
    let shift = 0
    while (true) {
      this.assertRoom(1)
      const b = this.bytes[this.position]!
      this.position++
      count |= (b & 0x7f) << shift
      if ((b & 0x80) === 0) break
      shift += 7
      if (shift > 35) throw new Error("invalid 7-bit encoded int")
    }
    return count >>> 0
  }

  readBinaryString(): string {
    const len = this.read7BitEncodedInt()
    if (len === 0) return ""
    const buf = this.readBytes(len)
    return new TextDecoder().decode(buf)
  }

  readBoolean(): boolean {
    this.assertRoom(1)
    const b = this.bytes[this.position]!
    this.position++
    return b !== 0
  }

  getRemaining(): number {
    return this.bytes.length - this.position
  }
}

export interface NestedPersistentObject {
  offset: number
  typeId: string
  typeIdRaw: number
  headerSize: number
  relA: bigint
  payloadSize: number
  payloadEnd: number
  payload: Uint8Array
  decoded: unknown
}

export function readNestedPersistentObject(
  reader: B2BinaryReader,
): NestedPersistentObject {
  const headerAt = reader.position
  const typeIdRaw = reader.readUInt32()
  const relA = reader.readInt64()
  const relB = reader.readInt64()
  const afterHeader = reader.position
  const payloadStart = afterHeader + Number(relA)
  const end = payloadStart + Number(relB)

  if (
    relB < 0n ||
    payloadStart < 0 ||
    end > reader.bytes.length ||
    end < payloadStart
  ) {
    throw new Error(
      `invalid object bounds at 0x${headerAt.toString(16)} type=0x${typeIdRaw.toString(16).padStart(8, "0")} relA=${relA} relB=${relB}`,
    )
  }

  reader.position = payloadStart
  const payload = reader.readBytes(Number(relB))
  reader.position = end

  return {
    offset: headerAt,
    typeId: `0x${typeIdRaw.toString(16).padStart(8, "0").toUpperCase()}`,
    typeIdRaw,
    headerSize: 20,
    relA,
    payloadSize: Number(relB),
    payloadEnd: end,
    payload,
    decoded: null,
  }
}
