from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import json
from typing import List
from transformers import AutoModelForCausalLM, AutoTokenizer

app = FastAPI(title="Excel to Smart Expense with Qwen2 (Test Mode)")

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy-load model
model = None
tokenizer = None

def get_model():
    global model, tokenizer
    if model is None or tokenizer is None:
        model_name = "Qwen/Qwen2-0.5B-Instruct"  # lightweight CPU-friendly model
        print("🔄 Loading Qwen2 model... (first run may take time)")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            device_map="auto"  # auto places on GPU if available, otherwise CPU
        )
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        print("✅ Model loaded successfully!")
    return model, tokenizer


def llm_categorize(expense: dict) -> dict:
    """Categorize a single expense using Qwen2 LLM"""
    model, tokenizer = get_model()

    prompt = f"""
    You are an expense categorization assistant.
    Categorize the expense into one of these categories:
    ["Travel", "Meals", "Office Supplies", "Entertainment", "Communications", "Other"].

    Expense details:
    Business Purpose: {expense['business_purpose']}
    Vendor: {expense['vendor']}
    Amount: {expense['amount']}
    Payment Type: {expense['payment_type']}
    Personal Expense: {expense['personal_expense']}
    Policy Violation: {expense['policy_violation_reason']}

    Return valid JSON only:
    {{
      "category": "...",
      "is_personal": true/false,
      "policy_violation_reason": "..."
    }}
    """

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True).to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=80)
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Debug: show raw LLM response
    print("\n--- Raw LLM Output ---")
    print(result)

    # Extract JSON safely
    try:
        json_output = json.loads(result[result.find("{"):result.rfind("}") + 1])
        return json_output
    except Exception:
        return {"category": "Other", "is_personal": False, "policy_violation_reason": ""}


@app.post("/upload_excel/")
async def upload_excel(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents), sheet_name="Sheet1")

        # 👇 Limit to first 10 rows for testing
        df = df.head(10)

        required_cols = [
            "Personal Expense", "Policy Violation Flag", "Policy Violation",
            "Business Type", "Business Purpose", "Transaction Date",
            "Payment Type", "Amount", "Vendor", "Receipt", "Pre-Approved"
        ]
        for col in required_cols:
            if col not in df.columns:
                return {"error": f"Missing required column: {col}"}

        expenses: List[dict] = []
        for _, row in df.iterrows():
            expense = {
                "date": str(row["Transaction Date"]),
                "business_type": str(row["Business Type"]),
                "business_purpose": str(row["Business Purpose"]),
                "vendor": str(row["Vendor"]),
                "amount": float(row["Amount"]),
                "payment_type": str(row["Payment Type"]),
                "personal_expense": str(row["Personal Expense"]).lower() == "yes",
                "policy_violation_flag": str(row["Policy Violation Flag"]).lower() == "yes",
                "policy_violation_reason": str(row["Policy Violation"]) if pd.notna(row["Policy Violation"]) else "",
                "receipt_available": str(row["Receipt"]).lower() == "yes",
                "pre_approved": str(row["Pre-Approved"]).lower() == "yes" if pd.notna(row["Pre-Approved"]) else False
            }

            # Categorize with LLM
            llm_result = llm_categorize(expense)
            expense["category"] = llm_result.get("category", expense["business_type"])
            expense["is_personal"] = llm_result.get("is_personal", expense["personal_expense"])
            expense["policy_violation_reason"] = (
                llm_result.get("policy_violation_reason") or expense["policy_violation_reason"]
            )

            expenses.append(expense)

        return {"expenses": expenses}

    except Exception as e:
        return {"error": str(e)}
