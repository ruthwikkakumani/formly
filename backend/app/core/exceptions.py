class AppError(Exception):
    """Domain error. Routes never see this — FastAPI maps it to HTTP in main.py."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)
