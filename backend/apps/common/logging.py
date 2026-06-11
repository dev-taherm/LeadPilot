import logging

logger = logging.getLogger('apps')


def get_logger(name=None):
    if name:
        return logging.getLogger(f'apps.{name}')
    return logger
