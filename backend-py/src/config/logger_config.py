import logging
import json

from config.config import LOG_LEVEL


class JsonFormatter(logging.Formatter):
    def format(self, record):
        user = getattr(record, "user", "unknown")
        log_message = {
            "level": record.levelname,
            "message": record.getMessage(),
            "timestamp": self.formatTime(record, self.datefmt),
            "name": record.name,
            "filename": record.pathname,
            "lineno": record.lineno,
            "user": user,
        }
        if record.exc_info:
            log_message["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_message)


def setup_logger():
    logger = logging.getLogger("eu_ldt_data_platform_logger")
    logger.setLevel(LOG_LEVEL)
    logging.getLogger("uvicorn.access").disabled = True
    logging.getLogger("alembic").setLevel(LOG_LEVEL)

    json_formatter = JsonFormatter()

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(json_formatter)

    logger.addHandler(stream_handler)

    return logger


logger = setup_logger()
