import webapp2
import json
import config
from google.appengine.api import search

class SubmitHandler(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write("")
        self.response.set_status(200)

    def post(self):
        jsonstr = self.request.body
        jsonobj = json.loads(jsonstr)

        if(jsonobj != None):
            doc = self.create_document(jsonobj)

            try:
                result = search.Index(name=config.INDEX_NAME).put(doc)
                self.response.set_status(201)
            except search.Error:
                self.response.set_status(500)
        else:
            self.response.set_status(400)

    @classmethod
    def create_document(self,imageObj):
        fields = [
        search.AtomField(name="id",value=str(imageObj["id"])),
        search.AtomField(name="user",value=str(imageObj["user"])),
        search.TextField(name="text",value=imageObj["text"])
        ]
        
        doc = search.Document(doc_id=str(imageObj["id"]),fields=fields)
        return doc

app = webapp2.WSGIApplication([
    ('/submit',SubmitHandler),
], debug=True)
