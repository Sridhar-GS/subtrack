from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class SubTrackException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


class NotFoundException(SubTrackException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=404, detail=detail)


class BadRequestException(SubTrackException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=400, detail=detail)


class ForbiddenException(SubTrackException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=403, detail=detail)


class ConflictException(SubTrackException):
    def __init__(self, detail: str = "Conflict"):
        super().__init__(status_code=409, detail=detail)


def register_exception_handlers(app: FastAPI):
    @app.exception_handler(SubTrackException)
    async def subtrack_exception_handler(request: Request, exc: SubTrackException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
