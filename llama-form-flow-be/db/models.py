from sqlalchemy import Column, Integer, String, Text, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class FormSessionModel(Base):
    __tablename__ = "form_sessions"

    id = Column(Integer, primary_key=True)
    session_id = Column(String, unique=True, index=True)
    fields = Column(JSON)  # list of field dicts
    current_index = Column(Integer, default=0)
    answers = Column(JSON, default=dict)
    image_width = Column(Integer, nullable=False, default=0)
    image_height = Column(Integer, nullable=False, default=0)
