#!/usr/bin/env python3
"""
Debug queue API issue
"""

import requests

BASE_URL = "http://localhost:8000"

def main():
    import time
    # Register admin first
    admin_email = f"admin_{int(time.time())}@test.com"
    register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
        'email': admin_email,
        'firstName': 'Test',
        'lastName': 'Admin',
        'password': 'Admin123!',
        'role': 'admin'
    })

    if register_response.status_code == 201:
        print("Admin registration successful")

        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            'email': admin_email,
            'password': 'Admin123!'
        })

        if login_response.status_code == 200:
            token = login_response.json()['data']['accessToken']
            print(f"Admin login successful, token: {token[:20]}...")

            # Test queue endpoint
            headers = {"Authorization": f"Bearer {token}"}
            queue_response = requests.get(f"{BASE_URL}/api/queue", headers=headers)

            print(f"Queue response status: {queue_response.status_code}")
            print(f"Queue response: {queue_response.text}")
        else:
            print(f"Login failed: {login_response.text}")
    else:
        print(f"Registration failed: {register_response.text}")

if __name__ == "__main__":
    main()
