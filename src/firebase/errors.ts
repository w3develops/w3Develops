
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: unknown;
};

export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(context, null, 2)}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // Point the stack trace at the caller, where the engine supports it
    const ErrorWithCapture = Error as ErrorConstructor & { captureStackTrace?: (target: object, constructor: Function) => void };
    if (ErrorWithCapture.captureStackTrace) {
      ErrorWithCapture.captureStackTrace(this, FirestorePermissionError);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}
