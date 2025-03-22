import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Spin } from 'antd';
import { PrinterOutlined, DownloadOutlined, TrophyOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CompletionCertificate = ({ induction, user, completionDate, fallbackName }) => {
  const [isModalVisible, setIsModalVisible] = useState(true); // Start with modal open
  const [generating, setGenerating] = useState(false);
  const certificateRef = useRef(null);
 
  // Get the display name with proper fallback
  const getDisplayName = () => {
    // If a fallback name is provided, use it as the first fallback
    if (fallbackName && fallbackName.trim()) {
      return fallbackName.trim();
    }
    
    if (!induction) return "Induction Program";
   
    // Check if name exists and isn't just whitespace
    if (induction.name && induction.name.trim()) {
      return induction.name.trim();
    }
   
    return "Induction Program";
  };
 
  const displayName = getDisplayName();
 
  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const downloadAsPDF = async () => {
    if (!certificateRef.current) return;
   
    setGenerating(true);
   
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
     
      const imgData = canvas.toDataURL('image/png');
     
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
     
      // A4 landscape dimensions
      const pdfWidth = 297;
      const pdfHeight = 210;
     
      // Calculate scaling to fit content properly on A4
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
     
      // Center the image on the page
      const xOffset = (pdfWidth - imgWidth * ratio) / 2;
      const yOffset = (pdfHeight - imgHeight * ratio) / 2;
     
      pdf.addImage(
        imgData,
        'PNG',
        xOffset,
        yOffset,
        imgWidth * ratio,
        imgHeight * ratio
      );
     
      // Create a safe filename
      const safeFilename = displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${safeFilename}_certificate.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  const printCertificate = () => {
    window.print();
  };

  // Add print styles to the document head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #certificate-container, #certificate-container * {
          visibility: visible;
        }
        #certificate-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 15mm;
          box-sizing: border-box;
        }
        /* Fix for black header and footer in print mode */
        #certificate-header {
          background-color: #000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        #certificate-footer {
          background-color: #000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
     
      .certificate-btn {
        background-color: #52c41a;
        border-color: #52c41a;
      }
     
      .certificate-btn:hover {
        background-color: #389e0d;
        border-color: #389e0d;
      }
    `;
   
    document.head.appendChild(styleElement);
   
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <>
      <Button
        type="primary"
        icon={<TrophyOutlined />}
        onClick={showModal}
        className="certificate-btn"
        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
      >
        View Certificate
      </Button>
      <Modal
        title="Completion Certificate"
        open={isModalVisible}
        onCancel={handleCancel}
        width={800}
        styles={{ body: { padding: '20px' } }}
        destroyOnClose={false}
        footer={[
          <Button key="close" onClick={handleCancel}>
            Close
          </Button>,
          <Button
            key="print"
            icon={<PrinterOutlined />}
            onClick={printCertificate}
          >
            Print
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadAsPDF}
            loading={generating}
          >
            Download PDF
          </Button>,
        ]}
      >
        {generating && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 10
          }}>
            <Spin size="large" tip="Generating your certificate..." />
          </div>
        )}
       
        <div
          id="certificate-container"
          ref={certificateRef}
          className="certificate-container"
          style={{
            border: '2px solid #000',
            padding: '0',
            textAlign: 'center',
            position: 'relative',
            background: '#ffffff',
            borderRadius: '5px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            marginBottom: '20px',
            width: '100%',
            aspectRatio: '1.414 / 1',
            overflow: 'hidden'
          }}
        >
          {/* Black header strip for logo */}
          <div 
            id="certificate-header"
            style={{
              position: 'relative',
              width: '100%',
              height: '70px',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '20px',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}
          >
            <img
              src="/images/AUTEventsInductionPortal.jpg"
              alt="AUT Events Induction Portal"
              style={{
                height: '50px',
                objectFit: 'contain',
                marginRight: '10px'
              }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
         
          <div style={{
            padding: '30px 40px',
            fontFamily: 'Arial, sans-serif',
            color: '#000'
          }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              marginBottom: '10px',
              color: '#000'
            }}>
              Certificate of Completion
            </h1>
           
            <div style={{
              backgroundImage: "url('/images/certificate-seal.jpg')",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: '150px',
              opacity: 0.05,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none'
            }}></div>
           
            <p style={{
              fontSize: '18px',
              margin: '20px 0'
            }}>
              This is to certify that
            </p>
           
            <h2 style={{
              fontSize: '30px',
              fontWeight: 'bold',
              margin: '10px 0',
              color: '#000'
            }}>
              {user?.displayName || user?.email || 'Team Member'}
            </h2>
           
            <p style={{
              fontSize: '18px',
              margin: '20px 0'
            }}>
              has successfully completed the
            </p>
           
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              margin: '10px 0 20px',
              color: '#000',
              padding: '0 40px'
            }}>
              {displayName}
            </h2>
           
            <p style={{
              fontSize: '18px',
              margin: '30px 0 10px'
            }}>
              Completion Date: <b>{formatDate(completionDate)}</b>
            </p>
           
            <div style={{
              margin: '60px 0 20px',
              fontSize: '14px',
              color: '#666'
            }}>
              <p>Certificate ID: {`CERT-${Date.now().toString(36).slice(-6).toUpperCase()}`}</p>
            </div>
          </div>
         
          {/* Black footer strip */}
          <div 
            id="certificate-footer"
            style={{
              position: 'absolute',
              bottom: '0',
              width: '100%',
              height: '20px',
              background: '#000',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}
          ></div>
        </div>
      </Modal>
    </>
  );
};

export default CompletionCertificate;