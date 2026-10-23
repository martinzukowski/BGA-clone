"""Builds Chaindle's word-similarity tables from GloVe word vectors.

    python scripts/chaindle-vectors.py path/to/glove.6B.zip

GloVe (https://nlp.stanford.edu/projects/glove/, also at huggingface.co/stanfordnlp/glove) gives every
word a 300-number vector; words used in similar contexts get similar vectors. For each word shown in a
Chaindle puzzle, this ranks the game's whole vocabulary by similarity to it and stores one byte per word
(255 = the closest word, falling off with rank). The game loads only the tables for the words it shows,
so any common word a player types gets a score, not just the hand-written answers.

Writes brain-games/chaindle/data/vocab.json (the word list, most common first) and
brain-games/chaindle/data/vec/<word>.bin (one Uint8 per vocab word). Needs numpy. Re-run after adding
puzzles; tables for words that already have one are rewritten too, so the output stays consistent.
"""
import json
import pathlib
import re
import sys
import zipfile

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'brain-games' / 'chaindle' / 'data'
VOCAB_SIZE = 30000          # most common words a guess can be scored against
SCAN_LINES = 400000         # all of GloVe 6B, so rare shown words (masticate) still get a table
WORD = re.compile(r'^[a-z]+(?:-[a-z]+)*$')
# A word's value for an anchor falls off with its similarity rank: the closest word scores 1,
# the 10th about .77, the 100th about .53, the 1,000th about .30 and the 10,000th about .07.
FALLOFF = 4.3


def anchors():
    src = (DATA / 'puzzles.js').read_text(encoding='utf-8')
    words = set()
    for m in re.finditer(r'w:\s*(\[[^\]]*\])', src):
        words.update(w.lower() for w in json.loads(m.group(1)))
    return sorted(words)


def load_glove(zip_path):
    with zipfile.ZipFile(zip_path) as z:
        name = next(n for n in z.namelist() if n.endswith('300d.txt'))
        words, vecs = [], []
        with z.open(name) as f:
            for i, raw in enumerate(f):
                if i >= SCAN_LINES:
                    break
                parts = raw.decode('utf-8', 'replace').rstrip().split(' ')
                words.append(parts[0])
                vecs.append(np.asarray(parts[1:], dtype=np.float32))
    m = np.vstack(vecs)
    m /= np.linalg.norm(m, axis=1, keepdims=True) + 1e-9
    return words, m


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    words, vecs = load_glove(sys.argv[1])
    index = {w: i for i, w in enumerate(words)}
    vocab_idx = [i for i, w in enumerate(words) if WORD.match(w)][:VOCAB_SIZE]
    vocab = [words[i] for i in vocab_idx]
    vv = vecs[vocab_idx]

    out = DATA / 'vec'
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('*.bin'):
        old.unlink()
    missing = []
    for a in anchors():
        if a not in index:
            missing.append(a)
            continue
        sims = vv @ vecs[index[a]]
        if a in vocab:
            sims[vocab.index(a)] = -np.inf          # the shown word itself never scores
        order = np.argsort(-sims)
        rank = np.empty(len(order), dtype=np.int64)
        rank[order] = np.arange(len(order))
        value = np.clip(1 - np.log10(rank + 1) / FALLOFF, 0, 1)
        (out / f'{a}.bin').write_bytes(np.round(value * 255).astype(np.uint8).tobytes())

    (DATA / 'vocab.json').write_text(json.dumps(vocab, separators=(',', ':')), encoding='utf-8')
    print(f'{len(vocab)} vocab words, {len(list(out.glob("*.bin")))} anchor tables')
    if missing:
        print('no vector for:', ', '.join(missing))


if __name__ == '__main__':
    main()
