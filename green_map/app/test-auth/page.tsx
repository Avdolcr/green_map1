"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TestAuth() {
  const [cookieStatus, setCookieStatus] = useState<any>(null);
  const [testCookieStatus, setTestCookieStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchResponse, setFetchResponse] = useState<string | null>(null);

  // Function to check existing cookies
  const checkCookies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug/cookies', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Error checking cookies: ${response.status}`);
      }

      const data = await response.json();
      setCookieStatus(data);
      setFetchResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error checking cookies:', err);
      setError(err instanceof Error ? err.message : 'Failed to check cookies');
    } finally {
      setLoading(false);
    }
  };

  // Function to set test cookies
  const setTestCookies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug/cookies', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Error setting test cookies: ${response.status}`);
      }

      const data = await response.json();
      setTestCookieStatus(data);
      // After setting test cookies, check if they were actually set
      setTimeout(checkCookies, 500);
    } catch (err) {
      console.error('Error setting test cookies:', err);
      setError(err instanceof Error ? err.message : 'Failed to set test cookies');
    } finally {
      setLoading(false);
    }
  };

  // Function to clear all cookies
  const clearCookies = () => {
    // Get all cookies
    const cookies = document.cookie.split(';');
    
    // For each cookie, set it to expire in the past
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
    
    // After clearing cookies, check the status again
    setTimeout(checkCookies, 500);
  };

  // Check cookies on mount
  useEffect(() => {
    checkCookies();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Authentication Test Page</h1>
          <p className="mt-2 text-lg text-gray-600">
            Use this page to diagnose authentication and cookie issues
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Cookie Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Current cookie status on your browser</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={checkCookies}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Check Cookies
              </button>
              <button
                onClick={clearCookies}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Clear Cookies
              </button>
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading...</p>
            ) : cookieStatus ? (
              <div>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Total cookies</dt>
                    <dd className="mt-1 text-sm text-gray-900">{cookieStatus.count}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Auth cookie present</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {cookieStatus.authCookiePresent ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          No
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Logged in cookie present</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {cookieStatus.loggedInCookiePresent ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          No
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">User Agent</dt>
                    <dd className="mt-1 text-sm text-gray-900 break-words">
                      {cookieStatus.userAgent}
                    </dd>
                  </div>
                </dl>
                
                {cookieStatus.cookies && cookieStatus.cookies.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Cookie Details</h4>
                    <ul className="divide-y divide-gray-200">
                      {cookieStatus.cookies.map((cookie: any, index: number) => (
                        <li key={index} className="py-3 flex justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{cookie.name}</span>
                            <span className="text-sm text-gray-500">
                              {cookie.hasValue ? `Has value (${cookie.length} characters)` : 'No value'}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No cookie information available</p>
            )}
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Test Cookie Setting</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Test if your browser can accept cookies from this site</p>
            </div>
            <button
              onClick={setTestCookies}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Set Test Cookies
            </button>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading...</p>
            ) : testCookieStatus ? (
              <div>
                <p className="text-sm text-gray-900">{testCookieStatus.message}</p>
                <p className="text-sm text-gray-500 mt-2">Token: {testCookieStatus.testToken}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No test has been run yet</p>
            )}
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Common Cookie Issues & Solutions</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="divide-y divide-gray-200">
              <div className="py-4">
                <dt className="text-sm font-medium text-gray-500">Browser Privacy Settings</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Some browsers block third-party cookies by default. If you're using Safari or have enhanced privacy settings, try allowing cookies for this site specifically.
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm font-medium text-gray-500">Private/Incognito Mode</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Using private/incognito mode may affect cookie storage. Try using regular browsing mode.
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm font-medium text-gray-500">Browser Extensions</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Privacy or ad-blocking extensions can interfere with cookies. Try temporarily disabling them.
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm font-medium text-gray-500">Old Browser Version</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Outdated browsers may not support modern cookie standards. Consider updating your browser.
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">API Response</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Raw response from the server</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <pre className="p-4 bg-gray-50 rounded-md overflow-auto text-xs">{fetchResponse || 'No response data'}</pre>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Return to Login
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 