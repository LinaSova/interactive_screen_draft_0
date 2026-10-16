"""Локальный сервер киоска.

Раздаёт страницы из этой папки и хранит общую статистику викторины в файле data/stats.json:
сколько раз каждый цвет угадали и сколько ошиблись — во всех режимах, за всё время.

Запуск:  python server.py [порт]      (по умолчанию 8000)
Затем откройте http://localhost:8000/menu.html
"""
import json
import os
import sys
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.abspath(__file__))
STATS_FILE = os.path.join(ROOT, 'data', 'stats.json')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


def load_stats():
    try:
        with open(STATS_FILE, encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, ValueError):
        return {}


def save_stats(stats):
    os.makedirs(os.path.dirname(STATS_FILE), exist_ok=True)
    tmp = STATS_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    os.replace(tmp, STATS_FILE)  # файл не повредится, если питание пропадёт посреди записи


class Handler(SimpleHTTPRequestHandler):
    # GET /api/stats  → { "ИМЯ ЦВЕТА": {"correct": n, "wrong": m}, ... }
    def do_GET(self):
        if self.path.split('?')[0] == '/api/stats':
            self.send_json(load_stats())
        else:
            super().do_GET()

    # POST /api/stats  {"name": "ИМЯ ЦВЕТА", "correct": true|false}  → +1 угадали / ошиблись
    def do_POST(self):
        if self.path.split('?')[0] != '/api/stats':
            self.send_error(404)
            return
        try:
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length).decode('utf-8'))
            name = str(data['name'])
            correct = bool(data['correct'])
        except (ValueError, KeyError, TypeError):
            self.send_error(400)
            return
        stats = load_stats()
        entry = stats.setdefault(name, {'correct': 0, 'wrong': 0})
        entry['correct' if correct else 'wrong'] += 1
        save_stats(stats)
        self.send_json(entry)

    def send_json(self, obj):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    # консоль Windows может не уметь печатать символы из пути к папке — не падать из-за этого
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(errors='replace')
    # однопоточный сервер: запросы обрабатываются по очереди, файл статистики не пишется одновременно
    server = HTTPServer(('127.0.0.1', PORT), partial(Handler, directory=ROOT))
    print(f'Киоск: http://localhost:{PORT}/menu.html   (статистика: {STATS_FILE})')
    print('Остановить: Ctrl+C')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
