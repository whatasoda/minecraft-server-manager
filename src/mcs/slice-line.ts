const MAX_STRIDE = 32;
export default function sliceLine(raw: string, stride: number, cursor: number = raw.length) {
  cursor = Math.min(Math.max(cursor, 0), raw.length);
  stride = stride ? Math.sign(stride) * Math.min(Math.max(Math.abs(stride), 0), MAX_STRIDE) : 0;
  const isForward = stride < 0 ? false : true;
  if (raw[cursor] === '\n') {
    cursor += isForward ? 0 : 1;
  }
  const lines = (isForward ? raw.slice(cursor) : raw.slice(0, cursor)).split('\n');

  const data = (isForward ? lines.slice(0, stride) : lines.slice(stride)).join('\n');
  const start = isForward ? cursor : cursor - data.length;
  const end = isForward ? cursor + data.length : cursor;

  return { data, start, end };
}
