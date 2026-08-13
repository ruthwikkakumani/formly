from sqlalchemy.orm import Session
from app.models import Answer, Form, Question, Response


def seed_database(db: Session):
    if not db.query(Form).first():
        feedback=Form(title="Product feedback", description="Help us make the next release better.", status="published", slug="product-feedback")
        feedback.questions=[Question(position=0,type="short_text",title="What should we call you?",required=True),Question(position=1,type="multiple_choice",title="How would you rate your experience?",options=["Amazing","Good","Okay","Needs work"],required=True),Question(position=2,type="long_text",title="What could we improve?",description="Your honest feedback helps.")]
        db.add(feedback); db.commit(); response=Response(form_id=feedback.id); db.add(response); db.flush(); db.add_all([Answer(response_id=response.id,question_id=feedback.questions[0].id,value="Maya"), Answer(response_id=response.id,question_id=feedback.questions[1].id,value="Amazing")]); db.commit()
    if db.query(Form).count() < 2:
        pulse=Form(title="Remote work pulse",description="A quick check-in for distributed teams.",status="published",slug="remote-work-pulse")
        pulse.questions=[Question(position=0,type="email",title="What is your work email?",required=True),Question(position=1,type="dropdown",title="How often do you work remotely?",options=["Every day","A few days a week","Occasionally","Never"],required=True),Question(position=2,type="rating",title="How satisfied are you with your setup?",required=True),Question(position=3,type="yes_no",title="Would you recommend remote work here?")]
        db.add(pulse); db.commit(); response=Response(form_id=pulse.id); db.add(response); db.flush(); db.add_all([Answer(response_id=response.id,question_id=pulse.questions[0].id,value="alex@example.com"),Answer(response_id=response.id,question_id=pulse.questions[1].id,value="Every day"),Answer(response_id=response.id,question_id=pulse.questions[2].id,value="5"),Answer(response_id=response.id,question_id=pulse.questions[3].id,value="Yes")]); db.commit()
