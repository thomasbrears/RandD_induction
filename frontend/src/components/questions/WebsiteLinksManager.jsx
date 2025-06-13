import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Tooltip, message } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { FaExternalLinkAlt } from "react-icons/fa";

const WebsiteLinksManager = ({ 
  initialLinks = [], 
  onLinksChange,
  maxLinks = 3 
}) => {
  const [links, setLinks] = useState(initialLinks);
  const [validationResults, setValidationResults] = useState({});
  const validationTimeouts = useRef({});

  // Update parent component when links change
  useEffect(() => {
    onLinksChange(links);
  }, [links, onLinksChange]);

  // Update local state when initialLinks change (for editing existing questions)
  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const addLink = () => {
    if (links.length < maxLinks) {
      setLinks([...links, { title: '', url: '' }]);
    }
  };

  const removeLink = (index) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
    
    // Clean up validation for removed link
    const newValidation = { ...validationResults };
    delete newValidation[index];
    setValidationResults(newValidation);
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
    };

  const validateUrl = (url) => {
    if (!url) return { isValid: true, message: '' };
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { 
        isValid: false, 
        message: 'URL must start with https:// or http://' 
      };
    }
    
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('.')) {
        return { 
          isValid: false, 
          message: 'Please enter a valid domain (e.g., autevents.co.nz)' 
        };
      }
      return { isValid: true, message: '' };
    } catch {
      return { 
        isValid: false, 
        message: 'Please enter a valid URL format' 
      };
    }
  };

  const handleUrlBlur = (index, value) => {
    let processedValue = value;
    
    // Auto-add https:// if needed
    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      if (value.includes('.') && !value.includes(' ') && value.length > 3) {
        processedValue = 'https://' + value;
        // Update the URL
        const newLinks = [...links];
        newLinks[index] = { ...newLinks[index], url: processedValue };
        setLinks(newLinks);
      }
    }
    
    // Validate and store result
    const validation = validateUrl(processedValue);
    setValidationResults(prev => ({
      ...prev,
      [index]: validation
    }));
  };

  const testLink = (url) => {
    const validation = validateUrl(url);
    if (!validation.isValid) {
      message.error('Please fix the URL format before testing');
      return;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
    message.success('Link opened in new tab');
  };

  const generateSuggestedTitle = (url) => {
    if (!url) return '';
    
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      const siteName = domain.split('.')[0];
      return `Visit ${siteName.charAt(0).toUpperCase() + siteName.slice(1)}`;
    } catch {
      return '';
    }
  };

  const autoFillTitle = (index, url) => {
    const suggested = generateSuggestedTitle(url);
    if (suggested && !links[index].title) {
      updateLink(index, 'title', suggested);
      message.info('Auto-generated title from URL');
    }
  };

  return (
    <div className="website-links-manager">
      <div className="mb-2">
        <span className="text-sm font-medium text-gray-700">
          Website Links ({links.length}/{maxLinks})
        </span>
        <p className="text-xs text-gray-500 mt-1">
          Add helpful website links that will appear as buttons when users take this question. You can also add in-text links in the description text if you prefer.
        </p>
      </div>

      <div className="space-y-3">
        {links.map((link, index) => {
          const validation = validationResults[index];
          const hasValidation = validation !== undefined;
          const isValid = hasValidation && validation.isValid;
          const showError = hasValidation && !validation.isValid && link.url;
          
          return (
            <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-start gap-2 mb-2">
                <LinkOutlined className="text-blue-500 mt-2" />
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Button Text *
                      </label>
                      {link.url && isValid && !link.title && (
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => autoFillTitle(index, link.url)}
                          className="text-xs p-0 h-auto"
                        >
                          Auto-generate from URL
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="e.g., View Safety Guidelines"
                      value={link.title}
                      onChange={(e) => updateLink(index, 'title', e.target.value)}
                      maxLength={50}
                      showCount
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Website URL *
                      </label>
                      <Tooltip title="URL must start with https:// or http://. If you enter just the domain (e.g., google.com), we'll automatically add https:// when you finish typing">
                        <ExclamationCircleOutlined className="text-gray-400 text-xs" />
                      </Tooltip>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="https://example.com"
                          value={link.url}
                          onChange={(e) => updateLink(index, 'url', e.target.value)}
                          onBlur={(e) => handleUrlBlur(index, e.target.value)}
                          className={`w-full ${showError ? 'border-red-300' : isValid ? 'border-green-300' : ''}`}
                          addonBefore="🔗"
                          suffix={
                            hasValidation ? (
                              isValid ? (
                                <CheckCircleOutlined className="text-green-500" />
                              ) : (
                                <ExclamationCircleOutlined className="text-red-500" />
                              )
                            ) : null
                          }
                        />
                        {showError && (
                          <p className="text-xs text-red-500 mt-1">{validation.message}</p>
                        )}
                      </div>
                      {link.url && isValid && (
                        <Tooltip title="Test this link">
                          <Button
                            type="primary"
                            icon={<FaExternalLinkAlt />}
                            onClick={() => testLink(link.url)}
                            className="flex-shrink-0"
                          />
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeLink(index)}
                  className="mt-6"
                  title="Remove Link"
                />
              </div>
            </div>
          );
        })}

        {/* Add Link Button */}
        {links.length < maxLinks && (
          <Button
            type="dashed"
            onClick={addLink}
            icon={<PlusOutlined />}
            className="w-full"
          >
            Add Website Link ({links.length}/{maxLinks})
          </Button>
        )}

        {links.length >= maxLinks && (
          <p className="text-xs text-gray-500 text-center">
            Maximum {maxLinks} website links allowed per question
          </p>
        )}
      </div>
    </div>
  );
};

export default WebsiteLinksManager;