import webapp2
import config
from google.appengine.api import search

class DeleteHandler(webapp2.RequestHandler):
    def get(self,imageId):
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write("")
        self.response.set_status(200)

    def delete(self, imageId):
        index = search.Index(config.INDEX_NAME)

        #Check if exists
        try:
            index.delete(imageId)
            self.response.set_status(202)
        except search.Error:
            self.response.set_status(500)
            pass

app = webapp2.WSGIApplication([
    ('/(\d+)', DeleteHandler),
], debug=True)
