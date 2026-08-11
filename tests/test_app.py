import os

def test_readme():
    assert os.path.exists("README.md")

def test_index():
    assert os.path.exists("index.html")

def test_css():
    assert os.path.exists("style.css")

def test_license():
    assert os.path.exists("LICENSE")