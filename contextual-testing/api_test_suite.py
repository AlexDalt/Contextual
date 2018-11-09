import requests
import grequests
import json
import config
import time


def upload_test(file=config.FILE, deleteImage=True):
    uri = config.API_URL + "upload"

    if(not(file.endswith(".png") or file.endswith(".jpg") ) ):
        print "Error: Bad Filename"
        return None

    try:
        image = open(file,"rb")
    except e:
        print "Error: " + e

    headers = {"Authorization":config.AUTH}
    files = {
        "image":image,
        "Content-Type": "image/png" if file.endswith(".png") else "image/jpeg",
        "Content-Length": "1"
    }
    r = requests.post(uri,headers=headers,files=files)

    if(deleteImage):
        data =  json.loads(r.text)
        delete_test(data["id"])
    else:
        pass

    return r

def search_test(term):
    headers = {"Authorization":config.AUTH}
    uri = config.API_URL + "images/search/" + term
    r = requests.get(uri, headers=headers)

    return r

def async_search_test(term="news",n=100):
    headers = {"Authorization":config.AUTH}
    uri = config.API_URL + "images/search/" + term
    rs = (grequests.get(uri,headers=headers) for i in range(n))
    grequests.map(rs)

def async_test(n=1000):
    headers = {"Authorization":config.AUTH}
    uri = config.API_URL + "images"
    rs = (grequests.get(uri,headers=headers) for i in range(n))
    grequests.map(rs)

def delete_test(id):
    headers = {"Authorization":config.AUTH}
    uri = config.API_URL + "images/" + str(id)
    r = requests.delete(uri,headers=headers)

    return r


def stress_test(n=50,file=config.FILE,term="test",wait=1):
    uploadsucc = 0
    searchsucc = 0
    deletesucc = 0

    for x in range(0,n):
        r1 = upload_test(file,deleteImage=False)
        time.sleep(wait)
        r2 = search_test(term)
        time.sleep(wait)

        data = json.loads(r1.text)
        r3 = delete_test(data["id"])

        #
        if(r1.ok):
            uploadsucc += 1

        if(r2.ok):
            searchsucc += 1

        if(r3.ok):
            deletesucc += 1

    print("UPLOAD SUCCESS: " + str(uploadsucc) + "/" + str(n))
    print("SEARCH SUCCESS: " + str(searchsucc) + "/" + str(n))
    print("DELETE SUCCESS: " + str(deletesucc) + "/" + str(n))

