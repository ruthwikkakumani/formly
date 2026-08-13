from contextlib import asynccontextmanager
from datetime import datetime
from collections import Counter
from uuid import uuid4
from fastapi import Depends, FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response as FastAPIResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import csv
import io
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session, joinedload
from database import Base, engine, SessionLocal
from models import Form, Question, Response, Answer, PartialResponse

def db_session():
    db = SessionLocal()
    try: yield db
    finally: db.close()

class QuestionInput(BaseModel):
    type: str = "short_text"; title: str = "Your question here"; description: str = ""; required: bool = False; options: list[str] = []; logic: dict = {}
class FormInput(BaseModel):
    title: str = "Untitled form"; description: str = ""; theme: dict = {"color":"#262627","background":"#f7f7f4"}; questions: list[QuestionInput] = []
class AnswerInput(BaseModel): question_id: int; value: str = ""
class SubmitInput(BaseModel): answers: list[AnswerInput]; visitor_id: str | None = None
class PartialInput(BaseModel): visitor_id: str; answers: dict[str, str]

def form_data(form, include_responses=False):
    return {"id":form.id,"title":form.title,"description":form.description,"status":form.status,"slug":form.slug,"theme":form.theme,"created_at":form.created_at,"response_count":len(form.responses),"questions":[{"id":q.id,"position":q.position,"type":q.type,"title":q.title,"description":q.description,"required":q.required,"options":q.options,"logic":q.logic} for q in form.questions]}

def get_form(db, id):
    f=db.query(Form).options(joinedload(Form.questions),joinedload(Form.responses)).filter(Form.id==id).first()
    if not f: raise HTTPException(404,"Form not found")
    return f

@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        columns = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(questions)")]
        if "logic" not in columns: conn.exec_driver_sql("ALTER TABLE questions ADD COLUMN logic JSON DEFAULT '{}'")
    Path("uploads").mkdir(exist_ok=True)
    db=SessionLocal()
    if not db.query(Form).first():
        f=Form(title="Product feedback",description="Help us make the next release better.",status="published",slug="product-feedback")
        f.questions=[Question(position=0,type="short_text",title="What should we call you?",required=True),Question(position=1,type="multiple_choice",title="How would you rate your experience?",options=["Amazing","Good","Okay","Needs work"],required=True),Question(position=2,type="long_text",title="What could we improve?",description="Your honest feedback helps.")]
        db.add(f); db.commit()
        r=Response(form_id=f.id); db.add(r); db.flush(); db.add_all([Answer(response_id=r.id,question_id=f.questions[0].id,value="Maya"),Answer(response_id=r.id,question_id=f.questions[1].id,value="Amazing")]); db.commit()
    if db.query(Form).count() < 2:
        f=Form(title="Remote work pulse",description="A quick check-in for distributed teams.",status="published",slug="remote-work-pulse")
        f.questions=[Question(position=0,type="email",title="What is your work email?",required=True),Question(position=1,type="dropdown",title="How often do you work remotely?",options=["Every day","A few days a week","Occasionally","Never"],required=True),Question(position=2,type="rating",title="How satisfied are you with your setup?",required=True),Question(position=3,type="yes_no",title="Would you recommend remote work here?")]
        db.add(f); db.commit()
        r=Response(form_id=f.id); db.add(r); db.flush(); db.add_all([Answer(response_id=r.id,question_id=f.questions[0].id,value="alex@example.com"),Answer(response_id=r.id,question_id=f.questions[1].id,value="Every day"),Answer(response_id=r.id,question_id=f.questions[2].id,value="5"),Answer(response_id=r.id,question_id=f.questions[3].id,value="Yes")]); db.commit()
    db.close(); yield

app=FastAPI(title="Formly API", lifespan=lifespan)
Path("uploads").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:3000"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])

@app.get("/api/forms")
def list_forms(db:Session=Depends(db_session)):
    return [form_data(x) for x in db.query(Form).options(joinedload(Form.questions),joinedload(Form.responses)).order_by(Form.updated_at.desc()).all()]
@app.post("/api/forms")
def create(data:FormInput,db:Session=Depends(db_session)):
    f=Form(title=data.title,description=data.description,slug=uuid4().hex[:10],theme=data.theme); db.add(f); db.flush()
    for i,q in enumerate(data.questions): db.add(Question(form_id=f.id,position=i,**q.model_dump()))
    db.commit(); return form_data(get_form(db,f.id))
@app.get("/api/forms/{id}")
def read(id:int,db:Session=Depends(db_session)): return form_data(get_form(db,id))
@app.put("/api/forms/{id}")
def update(id:int,data:FormInput,db:Session=Depends(db_session)):
    f=get_form(db,id); f.title=data.title; f.description=data.description; f.theme=data.theme
    db.query(Question).filter(Question.form_id==id).delete()
    for i,q in enumerate(data.questions): db.add(Question(form_id=id,position=i,**q.model_dump()))
    db.commit(); return form_data(get_form(db,id))
@app.delete("/api/forms/{id}")
def delete(id:int,db:Session=Depends(db_session)): db.delete(get_form(db,id)); db.commit(); return {"ok":True}
@app.post("/api/forms/{id}/duplicate")
def duplicate(id:int,db:Session=Depends(db_session)):
    src=get_form(db,id); f=Form(title=src.title+" (copy)",description=src.description,slug=uuid4().hex[:10],theme=src.theme); db.add(f); db.flush()
    for q in src.questions: db.add(Question(form_id=f.id,position=q.position,type=q.type,title=q.title,description=q.description,required=q.required,options=q.options,logic=q.logic))
    db.commit(); return form_data(get_form(db,f.id))
@app.post("/api/forms/{id}/publish")
def publish(id:int,db:Session=Depends(db_session)): f=get_form(db,id); f.status="published" if f.status=="draft" else "draft"; db.commit(); return form_data(f)
@app.get("/api/public/{slug}")
def public(slug:str,db:Session=Depends(db_session)):
    f=db.query(Form).options(joinedload(Form.questions),joinedload(Form.responses)).filter(Form.slug==slug,Form.status=="published").first()
    if not f: raise HTTPException(404,"This form is not available")
    return form_data(f)
@app.post("/api/public/{slug}/responses")
def submit(slug:str,data:SubmitInput,db:Session=Depends(db_session)):
    f=db.query(Form).options(joinedload(Form.questions)).filter(Form.slug==slug,Form.status=="published").first()
    if not f: raise HTTPException(404,"This form is not available")
    incoming={a.question_id:a.value.strip() for a in data.answers}
    for q in f.questions:
        v=incoming.get(q.id,"")
        if q.required and not v: raise HTTPException(422,f"{q.title} is required")
        if v and q.type=="email" and "@" not in v: raise HTTPException(422,"Please enter a valid email")
        if v and q.type=="number":
            try: float(v)
            except: raise HTTPException(422,"Please enter a number")
    r=Response(form_id=f.id); db.add(r); db.flush()
    for q in f.questions:
        if incoming.get(q.id): db.add(Answer(response_id=r.id,question_id=q.id,value=incoming[q.id]))
    if data.visitor_id: db.query(PartialResponse).filter(PartialResponse.visitor_id==data.visitor_id).delete()
    db.commit(); return {"id":r.id}
@app.post("/api/public/{slug}/partial")
def save_partial(slug:str,data:PartialInput,db:Session=Depends(db_session)):
    f=db.query(Form).filter(Form.slug==slug,Form.status=="published").first()
    if not f: raise HTTPException(404,"This form is not available")
    item=db.query(PartialResponse).filter(PartialResponse.visitor_id==data.visitor_id).first()
    if item: item.answers=data.answers
    else: db.add(PartialResponse(form_id=f.id,visitor_id=data.visitor_id,answers=data.answers))
    db.commit(); return {"ok":True}
@app.post("/api/public/{slug}/upload")
async def upload(slug:str,file:UploadFile=File(...),db:Session=Depends(db_session)):
    if not db.query(Form).filter(Form.slug==slug,Form.status=="published").first(): raise HTTPException(404,"This form is not available")
    safe_name=Path(file.filename or "upload").name
    name=f"{uuid4().hex}-{safe_name}"
    Path("uploads",name).write_bytes(await file.read())
    return {"url":f"/uploads/{name}","name":safe_name}
@app.get("/api/forms/{id}/responses")
def responses(id:int,db:Session=Depends(db_session)):
    f=get_form(db,id); rs=db.query(Response).options(joinedload(Response.answers)).filter(Response.form_id==id).order_by(Response.submitted_at.desc()).all()
    return [{"id":r.id,"submitted_at":r.submitted_at,"answers":{a.question_id:a.value for a in r.answers}} for r in rs]
@app.get("/api/forms/{id}/stats")
def stats(id:int,db:Session=Depends(db_session)):
    f=get_form(db,id); out=[]
    for q in f.questions:
        vals=[a.value for a in db.query(Answer).filter(Answer.question_id==q.id).all()]
        out.append({"question_id":q.id,"title":q.title,"responses":len(vals),"counts":dict(Counter(vals)) if q.type in ["multiple_choice","dropdown","yes_no","rating"] else {}})
    partials=db.query(PartialResponse).filter(PartialResponse.form_id==id).count()
    completed=db.query(Response).filter(Response.form_id==id).count()
    return {"questions":out,"completion":{"completed":completed,"in_progress":partials,"rate":round(completed/(completed+partials)*100) if completed+partials else 0}}
@app.get("/api/forms/{id}/responses.csv")
def export_csv(id:int,db:Session=Depends(db_session)):
    f=get_form(db,id); rows=db.query(Response).options(joinedload(Response.answers)).filter(Response.form_id==id).order_by(Response.submitted_at.desc()).all()
    output=io.StringIO(); writer=csv.writer(output); writer.writerow(["submitted_at",*[q.title for q in f.questions]])
    for r in rows:
        values={a.question_id:a.value for a in r.answers}; writer.writerow([r.submitted_at.isoformat(),*[values.get(q.id,"") for q in f.questions]])
    return FastAPIResponse(output.getvalue(),media_type="text/csv",headers={"Content-Disposition":f'attachment; filename="form-{id}-responses.csv"'})
