
export enum AUTH {
    INVALID_CREDENTIALS = 'invalid email address and Password',
    INVALID_PASSWORD = 'invalid password',
    CREDENTIALS_REQUIRED = 'email and password are required',
    PASSWORDS_MISMATCH = 'passwords do not match!',
    TWOFA_CODE_REQUIRED = "2f code is required",
    INVALID_2FA_CODE = "Invalid 2FA code",
    INVALID_EMAIL = "email doesn't exists",
    EMAIL_REQUIRED = "email is required",
    PASSWORD_REQUIRED = "password is required",
    PASSWORD_RESET = "password reset successfully",
    TOKEN_REQUIRED = "token is required",
    SUCCESS = 'Login successful..!!',
    OPT_REQUIRED = "OTP code is required",
    OPT_INVALID = "invalid OTP code",
    OPT_VERIFIED = 'OTP verified successfully'
}

export enum ADMIN_VALIDATIONS {
    ID_REQUIRED = 'id is required',
}

export enum API_RESPONSE {
    EMAIL_SENT = 'email sent successfully',
    SUCCESS = 'data fetch successfully...',
    SETTINGS_UPDATES = 'settings update successfully...'
}

export enum STATUS_CODE {
    // 2xx Success
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204,

    // 3xx Redirection
    MOVED_PERMANENTLY = 301,
    FOUND = 302,
    NOT_MODIFIED = 304,

    // 4xx Client Errors
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,

    // 5xx Server Errors
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
    GATEWAY_TIMEOUT = 504
}
