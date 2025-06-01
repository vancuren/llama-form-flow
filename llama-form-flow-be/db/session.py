import json
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from db.models import Base, FormSessionModel

DATABASE_URL = "sqlite+aiosqlite:///./form_sessions.db"

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_session(session_id: str) -> FormSessionModel | None:
    async with SessionLocal() as db:
        result = await db.execute(select(FormSessionModel).where(FormSessionModel.session_id == session_id))
        return result.scalar_one_or_none()

async def create_or_update_session(session_id: str, fields: list, image_width: int, image_height: int):
    async with SessionLocal() as db:
        session = await get_session(session_id)
        if session:
            session.fields = fields
        else:
            session = FormSessionModel(
                session_id=session_id,
                fields=fields,
                current_index=0,
                answers={},
                image_width=image_width,
                image_height=image_height
            )
            db.add(session)
        await db.commit()

async def update_session_answer(session_id: str, field_name: str, answer: str):
    async with SessionLocal() as db:
        session = await get_session(session_id)
        if session:
            session.answers[field_name] = answer
            session.current_index += 1
            await db.merge(session)
            await db.commit()
        return session
