import webapp2
import config
import json
from google.appengine.api import search

#5723348596162560 - a real user

class SearchHandler(webapp2.RequestHandler):
    #HTTP Request Handlers
    def get(self,userid,term):
        
        queryString = self.create_query_string(userid,term)
        searchResults = self.search_index(queryString)
        jsonMessage = self.create_json_message(searchResults.results)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(jsonMessage)
        self.response.set_status(200)

    #Search Functions
    @classmethod
    def create_query_string(self,userid,term):
        querystring = "user: " + str(userid) + " AND " + "text: ~" + str(term)
        return querystring

    @classmethod
    def search_index(self,query):
        index = search.Index(name=config.INDEX_NAME)
        results = index.search(query)
        return results

    @classmethod
    def create_json_message(self,documents):
        data = []
        for doc in documents:
            d = {}
            for f in doc.fields:
                d[f.name] = f.value
            data.append(d)

        if(len(data) != 0):
            jsonobj = json.dumps(data)
        else:
            jsonobj = "[]"
        return jsonobj

app = webapp2.WSGIApplication([
    ('/(\d+)/(\w+)', SearchHandler),
], debug=True)
