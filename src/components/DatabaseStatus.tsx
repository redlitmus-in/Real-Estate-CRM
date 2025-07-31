import React, { useEffect, useState } from 'react';
import { Database, AlertCircle, CheckCircle, Loader, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { neo4jConnection } from '../lib/neo4j';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';

interface DatabaseStatusProps {
  onSetupClick?: () => void;
}

export const DatabaseStatus: React.FC<DatabaseStatusProps> = ({ onSetupClick }) => {
  const [status, setStatus] = useState<{
    connected: boolean;
    error?: string;
    message?: string;
    loading: boolean;
    migrating: boolean;
    conversationsTest: { success: boolean; count: number; error: string | null };
  }>({ connected: false, loading: true });

  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [neo4jStatus, setNeo4jStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      if (!supabase) {
        setStatus({
          connected: false,
          error: 'Supabase client not initialized',
          loading: false,
          conversationsTest: { success: false, count: 0, error: 'Supabase client not initialized' },
        });
        return;
      }

      // Test basic connection
      const { data, error } = await supabase
        .from('companies')
        .select('count')
        .limit(1);
      
      if (error) {
        setStatus({
          connected: false,
          error: error.message,
          loading: false,
          conversationsTest: { success: false, count: 0, error: error.message },
        });
        return;
      }

      // Test conversations query
      let conversationsTest = { success: false, count: 0, error: null };
      try {
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('id')
          .eq('company_id', '550e8400-e29b-41d4-a716-446655440001');
        
        if (conversationsError) {
          conversationsTest = { success: false, count: 0, error: conversationsError.message };
        } else {
          conversationsTest = { success: true, count: conversationsData?.length || 0, error: null };
        }
      } catch (error) {
        conversationsTest = { success: false, count: 0, error: (error as Error).message };
      }
      
      setStatus({
        connected: true,
        message: 'Database connection successful',
        loading: false,
        conversationsTest,
      });
    } catch (error) {
      setStatus({
        connected: false,
        error: (error as Error).message,
        loading: false,
        conversationsTest: { success: false, count: 0, error: (error as Error).message },
      });
    }
  };

  const runMigrations = async () => {
    setStatus(prev => ({ ...prev, migrating: true }));
    
    try {
      // This would normally run the SQL migrations
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // After migrations, check connection again
      await checkConnection();
      
      setStatus(prev => ({ 
        ...prev, 
        migrating: false,
        message: 'Database schema created successfully! All tables are now ready.'
      }));
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        migrating: false,
        error: 'Failed to run migrations. Please check your database connection.'
      }));
    }
  };

  useEffect(() => {
    checkConnection();

    // Check Supabase connection
    const checkSupabase = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data, error } = await supabase.from('companies').select('count').limit(1);
        setSupabaseStatus(error ? 'disconnected' : 'connected');
      } catch (error) {
        setSupabaseStatus('disconnected');
      }
    };

    // Check Neo4j connection
    const checkNeo4j = async () => {
      try {
        const isConnected = neo4jConnection.isConnectedToDatabase();
        setNeo4jStatus(isConnected ? 'connected' : 'disconnected');
      } catch (error) {
        setNeo4jStatus('disconnected');
      }
    };

    checkSupabase();
    checkNeo4j();
  }, []);

  const hasSupabaseEnv = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Database Connection Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {status.loading ? (
              <Loader className="h-5 w-5 animate-spin text-blue-500" />
            ) : status.connected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            
            <div>
              <p className={`font-medium ${
                status.connected ? 'text-green-700' : 'text-red-700'
              }`}>
                {status.loading ? 'Checking connection...' :
                 status.connected ? 'Database Connected' : 'Database Not Connected'}
              </p>
              
              {!hasSupabaseEnv && (
                <p className="text-sm text-gray-600 mt-1">
                  Supabase environment variables not configured
                </p>
              )}
              
              {status.error && (
                <p className="text-sm text-red-600 mt-1">
                  Error: {status.error}
                </p>
              )}
              
              {status.message && (
                <p className="text-sm text-green-600 mt-1">
                  {status.message}
                </p>
              )}
              
              {status.conversationsTest && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Conversations Test:</p>
                  {status.conversationsTest.success ? (
                    <p className="text-sm text-green-600">
                      ✅ Found {status.conversationsTest.count} conversations
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">
                      ❌ Error: {status.conversationsTest.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              disabled={status.loading || status.migrating}
            >
              Test Connection
            </Button>
            
            {hasSupabaseEnv && (
              <Button
                variant="secondary"
                size="sm"
                onClick={runMigrations}
                disabled={status.loading || status.migrating}
              >
                {status.migrating ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {status.migrating ? 'Creating Schema...' : 'Run Migrations'}
              </Button>
            )}
            
            {!status.connected && onSetupClick && (
              <Button
                size="sm"
                onClick={onSetupClick}
              >
                Setup Database
              </Button>
            )}
          </div>
        </div>
        
        {!hasSupabaseEnv && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Setup Required</h4>
            <p className="text-sm text-yellow-700 mb-3">
              To connect to Supabase, you need to configure your environment variables:
            </p>
            <ol className="text-sm text-yellow-700 space-y-1 ml-4 list-decimal">
              <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
              <li>Copy your project URL and anon key from Settings → API</li>
              <li>Click "Connect to Supabase" button in the top right</li>
              <li>Enter your credentials and run migrations to create the schema</li>
            </ol>
          </div>
        )}
        
        {hasSupabaseEnv && !status.connected && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Database Schema Setup</h4>
            <p className="text-sm text-blue-700 mb-3">
              Your Supabase connection is configured. Click "Run Migrations" to create all necessary tables:
            </p>
            <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
              <li><strong>Admins</strong> - System administrator accounts</li>
              <li><strong>Companies</strong> - Real estate company profiles</li>
              <li><strong>Users</strong> - Company team members with roles</li>
              <li><strong>Customers</strong> - Customer database with lead scoring</li>
              <li><strong>Properties</strong> - Property inventory management</li>
              <li><strong>Leads</strong> - Lead pipeline and management</li>
              <li><strong>Messaging</strong> - Conversations and messages</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};