# Exports the deck to PDF with PowerPoint (COM). Args: <pptx> <pdf> (Windows paths)
param([string]$pptx, [string]$pdf)
$app = New-Object -ComObject PowerPoint.Application
$p = $app.Presentations.Open($pptx, $true, $false, $false)
$p.SaveAs($pdf, 32)
$p.Close(); $app.Quit()
"exported $pdf"
