//! Just enough HTTP/1.1 for a JSON API: one request per connection, plain http:// only.
//!
//! The 3DS's own TLS (httpc) trusts a root store from 2016 and won't verify today's certificates
//! without help, so for now the client talks plain HTTP to a server on the LAN. See docs/3ds.md.

use std::io::{Read, Write};
use std::net::TcpStream;
use std::time::Duration;

pub struct Response { pub status: u16, pub body: String }

/// `server` is "http://host:port" (port optional), `path` starts with "/".
pub fn request(server: &str, method: &str, path: &str, token: Option<&str>, body: Option<&str>) -> Result<Response, String> {
    let hostport = server.trim_end_matches('/').strip_prefix("http://")
        .ok_or_else(|| format!("server must start with http:// ({})", server))?;
    let (host, port) = match hostport.rsplit_once(':') {
        Some((h, p)) => (h, p.parse::<u16>().map_err(|_| format!("bad port in {}", server))?),
        None => (hostport, 80),
    };
    let mut s = TcpStream::connect((host, port)).map_err(|e| format!("can't reach {}:{} ({})", host, port, e))?;
    let _ = s.set_read_timeout(Some(Duration::from_secs(15)));
    let _ = s.set_write_timeout(Some(Duration::from_secs(15)));
    let mut req = format!("{} {} HTTP/1.1\r\nHost: {}\r\nUser-Agent: excoin-3ds/0.1\r\nAccept: application/json\r\nConnection: close\r\n",
        method, path, hostport);
    if let Some(t) = token { req += &format!("Authorization: Bearer {}\r\n", t); }
    let body = body.unwrap_or("");
    if method != "GET" { req += &format!("Content-Type: application/json\r\nContent-Length: {}\r\n", body.len()); }
    req += "\r\n";
    req += body;
    s.write_all(req.as_bytes()).map_err(|e| format!("send failed ({})", e))?;
    let mut raw = Vec::new();
    s.read_to_end(&mut raw).map_err(|e| format!("no reply ({})", e))?;
    parse(&raw)
}

fn parse(raw: &[u8]) -> Result<Response, String> {
    let split = raw.windows(4).position(|w| w == b"\r\n\r\n").ok_or("truncated reply")?;
    let head = String::from_utf8_lossy(&raw[..split]).to_string();
    let mut body = raw[split + 4..].to_vec();
    let status = head.split(' ').nth(1).and_then(|s| s.parse().ok()).ok_or("bad status line")?;
    if head.to_ascii_lowercase().contains("transfer-encoding: chunked") { body = dechunk(&body); }
    Ok(Response { status, body: String::from_utf8_lossy(&body).to_string() })
}

fn dechunk(mut b: &[u8]) -> Vec<u8> {
    let mut out = Vec::new();
    loop {
        let Some(eol) = b.windows(2).position(|w| w == b"\r\n") else { break };
        let n = usize::from_str_radix(String::from_utf8_lossy(&b[..eol]).split(';').next().unwrap_or("0").trim(), 16).unwrap_or(0);
        if n == 0 || b.len() < eol + 2 + n { break; }
        out.extend_from_slice(&b[eol + 2..eol + 2 + n]);
        b = &b[(eol + 4 + n).min(b.len())..];
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn parses_plain_and_chunked() {
        let r = parse(b"HTTP/1.1 201 Created\r\nContent-Length: 2\r\n\r\n{}").unwrap();
        assert_eq!((r.status, r.body.as_str()), (201, "{}"));
        let r = parse(b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n4\r\n{\"a\"\r\n3\r\n:1}\r\n0\r\n\r\n").unwrap();
        assert_eq!(r.body, "{\"a\":1}");
    }
}
