"""Request and response models. Allowed values come from app/reference.json (training-window levels)."""
import json
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

REFERENCE = json.loads((Path(__file__).parent / 'reference.json').read_text())
_CATS = REFERENCE['categories']

ShippingMode = Enum('ShippingMode', {v: v for v in _CATS['shipping_mode']}, type=str)
Market = Enum('Market', {v: v for v in _CATS['market']}, type=str)
OrderRegion = Enum('OrderRegion', {v: v for v in _CATS['order_region']}, type=str)
CustomerSegment = Enum('CustomerSegment', {v: v for v in _CATS['customer_segment']}, type=str)
PaymentType = Enum('PaymentType', {v: v for v in _CATS['payment_type']}, type=str)

ModelKey = Literal['logistic_regression', 'adaboost', 'xgboost', 'linear_svm', 'knn', 'naive_bayes',
                   'decision_tree', 'random_forest']


class Order(BaseModel):
    """One order, as known at the moment it is confirmed."""
    model_config = ConfigDict(use_enum_values=True, extra='forbid')

    order_date: datetime = Field(description='Date and time the order was placed (local time, to the minute).')
    shipping_mode: ShippingMode
    market: Market
    order_region: OrderRegion
    customer_segment: CustomerSegment
    payment_type: PaymentType
    n_lines: int = Field(ge=1, le=5, description='Number of product lines in the order (1 to 5 in the data).')
    total_qty: int = Field(ge=1, le=100, description='Total items across all lines.')
    gross_sales: float = Field(gt=0, le=10000, description='Order value before discount, in USD.')
    total_discount: float = Field(ge=0, description='Total discount on the order, in USD.')
    max_unit_price: float = Field(gt=0, le=5000, description='Price of the most expensive product in the order, in USD.')

    @model_validator(mode='after')
    def consistent(self):
        problems = []
        if self.order_region not in REFERENCE['market_regions'][self.market]:
            problems.append(f"order_region '{self.order_region}' is not in market '{self.market}'. "
                            f"Choose one of: {', '.join(REFERENCE['market_regions'][self.market])}.")
        if self.total_qty < self.n_lines:
            problems.append('total_qty must be at least n_lines (each line has at least one item).')
        if self.total_discount >= self.gross_sales:
            problems.append('total_discount must be less than gross_sales.')
        if self.max_unit_price > self.gross_sales:
            problems.append('max_unit_price cannot be more than gross_sales.')
        if problems:
            raise ValueError(' '.join(problems))
        return self


class PredictRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    order: Order
    model: Optional[ModelKey] = Field(default=None, description='Model key. Leave empty for the champion.')


class PredictAllRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    order: Order


class Prediction(BaseModel):
    model: str
    label: str
    owner_name: str
    owner_id: str
    available: bool
    probability: Optional[float] = None
    cutoff: Optional[float] = None
    cutoff_source: Optional[str] = None
    predicted_late: Optional[bool] = None
    tier: Optional[Literal['Low', 'Medium', 'High']] = None
    reason: Optional[str] = None
    provenance: Optional[str] = None
    note: Optional[str] = None
