class ApiResponse {
  constructor(statusCode, data, message = "success") {
    if (typeof statusCode !== "number") {
      this.statusCode = 200;
      this.data = statusCode;
      this.message = typeof data === "string" ? data : message;
      this.success = true;
      return;
    }

    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
export { ApiResponse };
