from typing import Optional, List


def build_features(
    liters: float,
    unit_price: float,
    total_amount: float,
    capacity_liters: Optional[float],
) -> List[float]:
    capacity = capacity_liters if capacity_liters and capacity_liters > 0 else max(liters, 1.0)
    ratio = liters / capacity
    return [float(liters), float(unit_price), float(total_amount), float(capacity), float(ratio)]
