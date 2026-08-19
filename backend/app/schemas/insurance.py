"""
app/schemas/insurance.py
Pydantic v2 models for the INSURANCE entity.
"""
from pydantic import BaseModel, Field
from typing import Optional


class InsuranceBase(BaseModel):
    patient_id: str
    insurance_vendor_name: Optional[str] = None
    coverage_type: Optional[str] = None
    annual_contribution: Optional[float] = None
    claim_amount: Optional[float] = None
    claim_status: Optional[str] = None
    copay_amount: Optional[float] = None
    out_of_pocket_amount: Optional[float] = None
    drug_coverage_flag: Optional[int] = Field(default=0, ge=0, le=1)
    prior_auth_flag: Optional[int] = Field(default=0, ge=0, le=1)
    monthly_income_inr: Optional[float] = None


class InsuranceCreate(InsuranceBase):
    policy_id: str


class InsuranceUpdate(InsuranceBase):
    patient_id: Optional[str] = None


class InsuranceResponse(InsuranceBase):
    policy_id: str

    model_config = {"from_attributes": True}


class InsuranceListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[InsuranceResponse]
