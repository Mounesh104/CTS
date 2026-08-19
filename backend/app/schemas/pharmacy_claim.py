"""
app/schemas/pharmacy_claim.py
Pydantic v2 models for the PHARMACY_CLAIM entity.
"""
from pydantic import BaseModel, Field
from typing import Optional


class PharmacyClaimBase(BaseModel):
    patient_id: str
    drug_id: Optional[str] = None
    dispense_date: Optional[str] = None
    expected_refill_date: Optional[str] = None
    refill_date: Optional[str] = None
    days_supply: Optional[int] = None
    quantity_dispensed: Optional[int] = None
    refill_gap_days: Optional[int] = Field(default=0)
    missed_refill_flag: Optional[int] = Field(default=0, ge=0, le=1)
    refill_cause: Optional[str] = None
    stockout_flag: Optional[int] = Field(default=0, ge=0, le=1)
    pharmacy_id: Optional[str] = None
    claim_status: Optional[str] = None
    copay_amount_inr: Optional[float] = None
    financial_burden: Optional[float] = None
    refill_number: Optional[int] = None


class PharmacyClaimCreate(PharmacyClaimBase):
    claim_id: str


class PharmacyClaimUpdate(PharmacyClaimBase):
    patient_id: Optional[str] = None


class PharmacyClaimResponse(PharmacyClaimBase):
    claim_id: str

    model_config = {"from_attributes": True}


class PharmacyClaimListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[PharmacyClaimResponse]
