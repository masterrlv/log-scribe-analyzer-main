from abc import ABC, abstractmethod
from datetime import datetime
import re
import json

class BaseLogParser(ABC):
    @abstractmethod
    def parse(self, line: str) -> dict:
        """Parse a single log line into a structured format"""
        pass
    
    @classmethod
    @abstractmethod
    def can_parse(cls, line: str) -> bool:
        """Check if this parser can handle the given log line"""
        pass

class PythonLogParser(BaseLogParser):
    PYTHON_LOG_PATTERN = r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) - ([A-Z]+) - (.*)$'
    
    def parse(self, line: str) -> dict:
        match = re.match(self.PYTHON_LOG_PATTERN, line)
        if match:
            timestamp_str, log_level, message = match.groups()
            timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S,%f')
            return {
                'timestamp': timestamp,
                'log_level': log_level,
                'source': 'Python',
                'message': message.strip(),
                'additional_fields': {}
            }
        return None
    
    @classmethod
    def can_parse(cls, line: str) -> bool:
        return bool(re.match(cls.PYTHON_LOG_PATTERN, line))

class ApacheLogParser(BaseLogParser):
    APACHE_LOG_PATTERN = r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}) - - \[(.*?)\] \"(.*?)\" (\d{3}) (\d+) \"(.*?)\" \"(.*?)\"'
    
    def parse(self, line: str) -> dict:
        match = re.match(self.APACHE_LOG_PATTERN, line)
        if match:
            ip, timestamp_str, request, status, size, referer, user_agent = match.groups()
            timestamp = datetime.strptime(timestamp_str, '%d/%b/%Y:%H:%M:%S %z')
            log_level = 'INFO' if int(status) < 400 else 'ERROR'
            return {
                'timestamp': timestamp,
                'log_level': log_level,
                'source': 'Apache',
                'message': request,
                'additional_fields': {
                    'ip': ip,
                    'status': status,
                    'size': size,
                    'referer': referer,
                    'user_agent': user_agent
                }
            }
        return None
    
    @classmethod
    def can_parse(cls, line: str) -> bool:
        return bool(re.match(cls.APACHE_LOG_PATTERN, line))

class JsonLogParser(BaseLogParser):
    def parse(self, line: str) -> dict:
        try:
            log_data = json.loads(line)
            return {
                'timestamp': datetime.fromisoformat(log_data.get('timestamp', '')),
                'log_level': log_data.get('level', 'INFO'),
                'source': log_data.get('source', 'unknown'),
                'message': log_data.get('message', ''),
                'additional_fields': {k: v for k, v in log_data.items() 
                                    if k not in ['timestamp', 'level', 'source', 'message']}
            }
        except (json.JSONDecodeError, ValueError):
            return None
    
    @classmethod
    def can_parse(cls, line: str) -> bool:
        line = line.strip()
        return line.startswith('{') and line.endswith('}')

class LogParserFactory:
    PARSERS = [
        PythonLogParser,
        ApacheLogParser,
        JsonLogParser,
        # Add new parsers here
    ]
    
    @classmethod
    def get_parser(cls, line: str) -> BaseLogParser:
        """Get the appropriate parser for the given log line"""
        for parser_cls in cls.PARSERS:
            if parser_cls.can_parse(line):
                return parser_cls()
        return None
    
    @classmethod
    def parse_line(cls, line: str) -> dict:
        """Parse a single line using the appropriate parser"""
        parser = cls.get_parser(line)
        if parser:
            return parser.parse(line)
        return None
    
    @classmethod
    def detect_format(cls, lines: list[str]) -> str:
        """Detect the log format from sample lines"""
        for line in lines:
            for parser_cls in cls.PARSERS:
                if parser_cls.can_parse(line):
                    return parser_cls.__name__.replace('Parser', '').lower()
        return None
