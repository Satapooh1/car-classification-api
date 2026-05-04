import csv
import sys
from collections import defaultdict

JTL_PATH = "results/stress.jtl"

steps = defaultdict(lambda: {
    "total": 0, "errors": 0,
    "http500": 0, "timeout": 0, "other_err": 0,
    "elapsed_sum": 0
})

with open(JTL_PATH, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        label = row["label"]
        success = row["success"] == "true"
        code = row.get("responseCode", "")
        msg = row.get("responseMessage", "")
        elapsed = int(row.get("elapsed", 0))

        steps[label]["total"] += 1
        steps[label]["elapsed_sum"] += elapsed

        if not success:
            steps[label]["errors"] += 1
            if code == "500":
                steps[label]["http500"] += 1
            elif "Timeout" in msg or "timeout" in msg or "SocketTimeout" in msg:
                steps[label]["timeout"] += 1
            else:
                steps[label]["other_err"] += 1

print(f"\n{'Step':<35} {'Samples':>8} {'Avg(ms)':>8} {'RPS':>6} {'Err%':>6} {'HTTP500':>8} {'Timeout':>8}")
print("-" * 90)

first_error_step = None
breaking_point = None
prev_rps = 0

for label, d in steps.items():
    total = d["total"]
    avg_ms = d["elapsed_sum"] / total if total else 0
    err_pct = d["errors"] / total * 100 if total else 0
    # duration per step ~60s
    rps = total / 60

    if d["http500"] > 0 and first_error_step is None:
        first_error_step = label

    if err_pct > 50 and breaking_point is None:
        breaking_point = label

    print(f"{label:<35} {total:>8} {avg_ms:>8.0f} {rps:>6.1f} {err_pct:>6.1f}% {d['http500']:>8} {d['timeout']:>8}")
    prev_rps = rps

print("\n" + "=" * 90)
print(f"HTTP 500 แรกโผล่ที่ : {first_error_step or 'ไม่พบ'}")
print(f"Breaking Point (>50% error) : {breaking_point or 'ไม่พบ — ระบบรับได้ทุก step'}")