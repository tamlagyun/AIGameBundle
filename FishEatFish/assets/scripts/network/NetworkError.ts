export class NetworkError extends Error { constructor(message: string, readonly code = 'NETWORK_ERROR') { super(message); } }
