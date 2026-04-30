import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { AtendimentoData } from '@/types/atendimento';
import { TIPOS_ATENDIMENTO_CONFIG, ACOES_ESPECIFICAS_CONFIG } from '@/types/tiposAtendimentoConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import logoHorizontal from '@/assets/logo-horizontal.png';

interface GerarPDFProps {
  data: AtendimentoData;
  responsavelNome?: string;
  clientesNomes: string[];
}

export function GerarPDF({ data, responsavelNome, clientesNomes }: GerarPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      // Helper function to add new page if needed
      const checkNewPage = (requiredSpace: number) => {
        if (yPos + requiredSpace > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPos = margin;
        }
      };

      // Helper function to draw section header
      const drawSectionHeader = (title: string) => {
        checkNewPage(15);
        pdf.setFillColor(30, 150, 80);
        pdf.rect(margin, yPos, contentWidth, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin + 3, yPos + 5.5);
        pdf.setTextColor(0, 0, 0);
        yPos += 12;
      };

      // Logo
      try {
        const img = new Image();
        img.src = logoHorizontal;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        pdf.addImage(img, 'PNG', margin, yPos, 50, 15);
        yPos += 20;
      } catch (e) {
        // Continue without logo if it fails
        yPos += 5;
      }

      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 150, 80);
      pdf.text('RELATÓRIO DE ATENDIMENTO', pageWidth / 2, yPos, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      yPos += 10;

      // Date/Time info
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const dataInicio = format(data.data_inicio, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      const dataFim = data.data_fim ? format(data.data_fim, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Em andamento';
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Data/Hora Início:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(dataInicio, margin + 35, yPos);
      yPos += 5;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Data/Hora Fim:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(dataFim, margin + 35, yPos);
      yPos += 5;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Responsável:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(responsavelNome || 'Não definido', margin + 35, yPos);
      yPos += 5;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Registro Fotográfico:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(data.possui_foto_final ? 0 : 150, data.possui_foto_final ? 128 : 0, 0);
      pdf.text(data.possui_foto_final ? 'SIM' : 'NÃO', margin + 40, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 10;

      // Clients
      if (clientesNomes.length > 0) {
        drawSectionHeader('CLIENTES ATENDIDOS');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        clientesNomes.forEach(cliente => {
          checkNewPage(6);
          pdf.text(`• ${cliente}`, margin + 3, yPos);
          yPos += 5;
        });
        yPos += 3;
      }

      // Service Types
      if (data.tipos_atendimento.length > 0) {
        drawSectionHeader('TIPOS DE ATENDIMENTO');
        pdf.setFontSize(10);
        data.tipos_atendimento.forEach(tipo => {
          const config = TIPOS_ATENDIMENTO_CONFIG.find(t => t.nome === tipo);
          checkNewPage(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`• ${tipo}`, margin + 3, yPos);
          pdf.setTextColor(100, 100, 100);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'italic');
          
          if (config?.plano) {
            pdf.text(`[${config.plano}]`, margin + 3 + pdf.getTextWidth(`• ${tipo}`) + 3, yPos);
          }
          yPos += 4;
          
          if (config?.descricao) {
            const descLines = pdf.splitTextToSize(config.descricao, contentWidth - 10);
            pdf.setFont('helvetica', 'normal');
            descLines.forEach((line: string) => {
              checkNewPage(5);
              pdf.text(line, margin + 6, yPos);
              yPos += 4;
            });
          }
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          yPos += 2;
        });
        yPos += 3;
      }

      // Specific Actions
      if (data.acoes_especificas.length > 0) {
        drawSectionHeader('AÇÕES ESPECÍFICAS');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        data.acoes_especificas.forEach(acao => {
          const config = ACOES_ESPECIFICAS_CONFIG.find(a => a.nome === acao);
          checkNewPage(6);
          pdf.text(`• ${acao}`, margin + 3, yPos);
          if (config?.plano) {
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(8);
            pdf.text(`[${config.plano}]`, margin + 3 + pdf.getTextWidth(`• ${acao}`) + 3, yPos);
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(10);
          }
          yPos += 5;
        });
        yPos += 3;
      }

      // Meeting Topics
      const topicosPreenchidos = data.topicos_reuniao.filter(t => t.texto.trim());
      if (topicosPreenchidos.length > 0) {
        drawSectionHeader('TÓPICOS TRATADOS NA REUNIÃO');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        topicosPreenchidos.forEach(topico => {
          checkNewPage(8);
          const lines = pdf.splitTextToSize(`${topico.numero}. ${topico.texto}`, contentWidth - 10);
          lines.forEach((line: string) => {
            pdf.text(line, margin + 3, yPos);
            yPos += 5;
          });
        });
        yPos += 3;
      }

      // Notes
      if (data.anotacoes?.trim()) {
        drawSectionHeader('ANOTAÇÕES');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const notesLines = pdf.splitTextToSize(data.anotacoes, contentWidth - 6);
        notesLines.forEach((line: string) => {
          checkNewPage(5);
          pdf.text(line, margin + 3, yPos);
          yPos += 5;
        });
        yPos += 3;
      }

      // Demands
      const demandasValidas = data.demandas.filter(d => d.descricao.trim());
      if (demandasValidas.length > 0) {
        drawSectionHeader('DEMANDAS EM EXECUÇÃO (SISRAMOS)');
        pdf.setFontSize(10);
        demandasValidas.forEach((demanda, i) => {
          checkNewPage(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${i + 1}.`, margin + 3, yPos);
          pdf.setFont('helvetica', 'normal');
          const lines = pdf.splitTextToSize(demanda.descricao, contentWidth - 15);
          lines.forEach((line: string, lineIndex: number) => {
            pdf.text(line, margin + 10, yPos);
            if (lineIndex === 0) {
              pdf.setTextColor(100, 100, 100);
              pdf.setFontSize(8);
              pdf.text(`[${demanda.plano}]`, margin + 10 + pdf.getTextWidth(line) + 3, yPos);
              pdf.setTextColor(0, 0, 0);
              pdf.setFontSize(10);
            }
            yPos += 5;
          });
          yPos += 2;
        });
        yPos += 3;
      }

      // Photos section
      if (data.fotos.length > 0) {
        drawSectionHeader('REGISTRO FOTOGRÁFICO');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        const fotosIniciais = data.fotos.filter(f => f.tipo === 'inicial');
        const fotosDurante = data.fotos.filter(f => f.tipo === 'durante');
        const fotosFinais = data.fotos.filter(f => f.tipo === 'final');

        if (fotosIniciais.length > 0) {
          pdf.text(`Fotos Iniciais: ${fotosIniciais.length}`, margin + 3, yPos);
          yPos += 5;
        }
        if (fotosDurante.length > 0) {
          pdf.text(`Fotos Durante: ${fotosDurante.length}`, margin + 3, yPos);
          yPos += 5;
        }
        if (fotosFinais.length > 0) {
          pdf.text(`Fotos Finais: ${fotosFinais.length}`, margin + 3, yPos);
          yPos += 5;
        }

        // Add photo thumbnails (max 6 per row)
        const photoSize = 25;
        const photosPerRow = 6;
        let photoX = margin;
        
        for (let i = 0; i < Math.min(data.fotos.length, 12); i++) {
          if (i > 0 && i % photosPerRow === 0) {
            photoX = margin;
            yPos += photoSize + 5;
          }
          
          checkNewPage(photoSize + 10);
          
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = data.fotos[i].url;
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
            
            if (img.complete && img.naturalWidth > 0) {
              pdf.addImage(img, 'JPEG', photoX, yPos, photoSize, photoSize);
            }
          } catch (e) {
            pdf.setDrawColor(200);
            pdf.rect(photoX, yPos, photoSize, photoSize);
            pdf.setFontSize(6);
            pdf.text('Foto', photoX + 8, yPos + 12);
          }
          
          photoX += photoSize + 3;
        }
        yPos += photoSize + 8;
      }

      // Footer
      const footerY = pdf.internal.pageSize.getHeight() - 10;
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Ramos Engenharia Ambiental - Relatório gerado automaticamente', pageWidth / 2, footerY, { align: 'center' });

      // Save PDF
      const fileName = `atendimento_${format(data.data_inicio, 'yyyy-MM-dd_HHmm')}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      variant="outline"
      className="w-full h-12 text-base"
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <FileDown className="w-5 h-5 mr-2" />
          Gerar PDF do Relatório
        </>
      )}
    </Button>
  );
}
