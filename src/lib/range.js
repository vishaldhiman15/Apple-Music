export async function serveRange(response, range) {
  const buffer = await response.arrayBuffer(),
    length = buffer.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range || "");
  if (!match || (!match[1] && !match[2]))
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${length}` },
    });
  let start = match[1]
    ? Number(match[1])
    : Math.max(0, length - Number(match[2]));
  let end = match[1]
    ? match[2]
      ? Math.min(Number(match[2]), length - 1)
      : length - 1
    : length - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start >= length ||
    end < start
  )
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${length}` },
    });
  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${length}`,
      "Accept-Ranges": "bytes",
    },
  });
}
