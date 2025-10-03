import React from "react";

const PrintableReceipt = React.forwardRef(({ skill ,sessionId}, ref) => {
  if (!skill) return null;

  const styles = {
    container: {
      width: '800px',
      padding: '40px',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      color: '#333333',
    },
    header: {
      padding: '30px',
      backgroundImage: 'linear-gradient(to right, #4f46e5, #9333ea)',
      color: '#ffffff',
      borderRadius: '8px 8px 0 0',
      textAlign: 'center',
    },
    headerTitle: {
      fontSize: '28px',
      fontWeight: 'bold',
      margin: 0,
    },
    headerSubtitle: {
      fontSize: '14px',
      marginTop: '8px',
    },
    body: {
      padding: '40px',
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid #eeeeee',
      fontSize: '14px',
    },
    totalSection: {
      marginTop: '30px',
      paddingTop: '10px',
      borderTop: '2px solid #dddddd',
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '16px',
      fontWeight: 'bold',
      marginTop: '5px',
    },
    status: {
      display: 'inline-block',
      marginTop: '10px',
      padding: '5px 10px',
      backgroundColor: '#e0f2e9',
      color: '#16a34a',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 'bold',
    },
  };

  return (
    <div style={{ position: 'absolute', left: '-9999px' }}>
      <div ref={ref} style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Payment Receipt</h1>
          <p style={styles.headerSubtitle}>Thank you for your purchase!</p>
        </div>
        <div style={styles.body}>
          <div style={styles.detailRow}>
            <span>Course Title:</span>
            <span>{skill.title}</span>
          </div>
          <div style={styles.detailRow}>
            <span>Instructor:</span>
            <span>{skill.instructor}</span>
          </div>
          <div style={styles.detailRow}>
            <span>Price:</span>
            <span style={{ fontWeight: 'bold' }}>₹{skill.price}</span>
          </div>
          <div style={styles.detailRow}>
            <span>Date:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div style={styles.detailRow}>
            <span>Transaction ID:</span>
            <span>{sessionId?.slice(0, 21)}</span>
           </div>
          <div style={styles.totalSection}>
            <div style={styles.totalRow}>
              <span>TOTAL PAID:</span>
              <span>₹{skill.price}</span>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <span style={styles.status}>✓ PAYMENT SUCCESS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrintableReceipt;
