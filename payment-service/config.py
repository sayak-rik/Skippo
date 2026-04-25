from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    razorpay_key_id:        str = ""
    razorpay_key_secret:    str = ""
    razorpay_webhook_secret: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
