from fastapi.responses import JSONResponse, Response

from config.logger_config import logger


class ResponseHandlers:
    @staticmethod
    def handle_response(response, user):
        """Handles common response processing for GET requests."""
        status_code = response.status_code
        reason = response.reason
        content = response.json()

        if status_code in (200, 201):
            logger.info(f"{reason}, status: {status_code}", extra={"user": user})
            headers = {
                "Content-Type": response.headers.get("Content-Type"),
                "NGSILD-EntityMap": response.headers.get("NGSILD-EntityMap"),
            }
            return JSONResponse(
                content=content, headers=headers, status_code=status_code
            )
        else:
            logger.error(f"{reason}, status: {status_code}", extra={"user": user})
            return JSONResponse(status_code=status_code, content=content)

    @staticmethod
    def handle_create_response(response, user):
        """Handles response processing for POST (create) requests."""
        status_code = response.status_code
        reason = response.reason

        if status_code in (200, 201):
            logger.info(f"{reason}, status: {status_code}", extra={"user": user})
            headers = {"Location": response.headers.get("Location")}
            return JSONResponse(
                status_code=status_code, content={"message": reason}, headers=headers
            )
        elif status_code == 204:
            logger.info(f"{reason}, status: {status_code}", extra={"user": user})
            return Response(status_code=status_code)
        else:
            logger.error(f"{reason}, status: {status_code}", extra={"user": user})
            content = response.json()
            return JSONResponse(status_code=status_code, content=content)

    @staticmethod
    def handle_temporal_response(response, user):
        status_code = response.status_code
        reason = response.reason
        content = response.json()

        if status_code in (200, 201):
            logger.info(f"{reason}, status: {status_code}", extra={"user": user})
            if response.headers.get("Link"):
                headers = {
                    "Content-Type": response.headers.get("Content-Type"),
                    "Link": response.headers.get("Link"),
                }
            else:
                headers = {
                    "Content-Type": response.headers.get("Content-Type"),
                }
            return JSONResponse(
                content=content, headers=headers, status_code=status_code
            )
        else:
            logger.error(f"{reason}, status: {status_code}", extra={"user": user})
            return JSONResponse(status_code=status_code, content=content)
