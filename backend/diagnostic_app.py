from fastapi import FastAPI
import uvicorn
import database

app = FastAPI(title="Diagnostic App")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Diagnostic app is running"}

if __name__ == "__main__":
    print("Starting diagnostic app...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
