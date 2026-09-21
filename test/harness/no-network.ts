// Loaded before every acceptance test. The suite runs on fakes alone, so any attempt
// to open a socket is a bug in the test or a real adapter leaking into a use case.

import net from "node:net";
import tls from "node:tls";

function refuse(what: string): never {
  throw new Error(
    `Acceptance tests never open a socket, but something tried ${what}. Use the fakes in test/harness.`,
  );
}

globalThis.fetch = () => refuse("fetch");
net.Socket.prototype.connect = () => refuse("net.Socket.connect");
net.connect = () => refuse("net.connect");
net.createConnection = () => refuse("net.createConnection");
tls.connect = () => refuse("tls.connect");
