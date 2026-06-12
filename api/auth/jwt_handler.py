import jwt
import datetime

from config.settings import settings

def generate_token(user):

    return jwt.encode({
        'user_id': user[0],
        'username': user[1],
        'token_version': user[3],
        'exp': (
            datetime.datetime.now(datetime.timezone.utc) 
            + datetime.timedelta(hours=1)
        ),
    }, 
    settings.JWT_SECRET, 
    algorithm="HS256"
    )