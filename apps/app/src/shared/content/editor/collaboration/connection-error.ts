// https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
const WEBSOCKET_CLOSE_CODES = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS_RECVD: 1005,
  ABNORMAL_CLOSURE: 1006,
  INVALID_FRAME_PAYLOAD_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MANDATORY_EXT: 1010,
  INTERNAL_SERVER_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  TLS_HANDSHAKE: 1015,
  HOCUSPOCUS_FORBIDDEN: 4403,
} as const;

export function isTransientConnectionClose(code: number): boolean {
  return (
    code === WEBSOCKET_CLOSE_CODES.NORMAL_CLOSURE ||
    code === WEBSOCKET_CLOSE_CODES.GOING_AWAY ||
    code === WEBSOCKET_CLOSE_CODES.ABNORMAL_CLOSURE
  );
}

export function mapCloseEventToErrorMessage(event: {
  code: number;
  reason?: string;
}): string {
  if (event.reason) {
    return event.reason;
  }

  switch (event.code) {
    case WEBSOCKET_CLOSE_CODES.HOCUSPOCUS_FORBIDDEN:
      return "Not authorized to access this document.";
    case WEBSOCKET_CLOSE_CODES.POLICY_VIOLATION:
      return "Policy violation. Access denied.";
    case WEBSOCKET_CLOSE_CODES.MESSAGE_TOO_BIG:
      return "The document size exceeded the server limit.";
    case WEBSOCKET_CLOSE_CODES.INTERNAL_SERVER_ERROR:
      return "The server encountered an unexpected error.";
    case WEBSOCKET_CLOSE_CODES.TRY_AGAIN_LATER:
      return "The server is temporarily overloaded. Please try again later.";
    case WEBSOCKET_CLOSE_CODES.PROTOCOL_ERROR:
      return "A protocol error occurred. Please refresh the page.";
    case WEBSOCKET_CLOSE_CODES.UNSUPPORTED_DATA:
      return "The server received unsupported data.";
    default:
      return `Connection closed (code ${event.code}).`;
  }
}
